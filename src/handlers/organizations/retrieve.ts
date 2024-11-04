/* eslint-disable import/no-extraneous-dependencies */
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	ScanCommand,
	ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import _ from 'lodash';

type Sort = {
	field: string;
	order: any;
};

module.exports.handle = async (event: APIGatewayProxyEvent) => {
	async function fetchItemsWithPagination(
		params: ScanCommandInput,
		targetPage: number,
		sort: Sort[],
	) {
		let allItems: Record<string, any> = [];
		let lastEvaluatedKey = null;
		const lastEvaluatedKeys = [];

		const updatedParams = params;

		const client = new DynamoDBClient({ region: process.env.AWS_REGION });
		const docClient = DynamoDBDocumentClient.from(client);

		// Perform scan until all items are fetched
		do {
			try {
				// Set ExclusiveStartKey if we have a lastEvaluatedKey
				if (lastEvaluatedKey) {
					updatedParams.ExclusiveStartKey = lastEvaluatedKey;
				}

				// eslint-disable-next-line no-await-in-loop
				const response = await docClient.send(
					new ScanCommand(updatedParams),
				);

				allItems = allItems.concat(response.Items || []);

				// Update the last evaluated key
				lastEvaluatedKey = response.LastEvaluatedKey;
				lastEvaluatedKeys.push(response.LastEvaluatedKey);
			} catch (error) {
				console.error('Error fetching items: ', error);
				throw error;
			}
		} while (lastEvaluatedKey); // Continue until there's no more data

		if (sort.length) {
			const sortFields = sort.map((a) => a.field);
			const sortOrders = sort.map((a) => a.order);

			allItems = _.orderBy(allItems, sortFields, sortOrders);
		}

		// Calculate indices for the desired page
		const pageSize = updatedParams.Limit || 1;
		const startIndex = (targetPage - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const currentItems = allItems.slice(startIndex, endIndex);
		const totalItems = allItems.length;
		const totalPages = pageSize ? Math.ceil(totalItems / pageSize) : 1;

		if (!currentItems.length || !totalItems.length) {
			return {
				statusCode: 404,
				body: JSON.stringify({
					message: 'No results. Pleas try again',
				}),
			};
		}

		if (targetPage > totalPages) {
			return {
				statusCode: 404,
				body: JSON.stringify({
					message: `Page not found. Total of pages are ${totalPages}`,
				}),
			};
		}

		return {
			statusCode: 200,
			body: JSON.stringify({
				items: currentItems,

				pagination: {
					page: targetPage,
					pageSize,
					pageCount: totalPages,
					total: totalItems,
				},
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		};
	}

	try {
		const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || '';
		let pageNumber = 1;
		let sort: Sort[] = [];

		if (event.queryStringParameters?.pageNumber) {
			pageNumber = parseInt(event.queryStringParameters?.pageNumber, 10);
		}

		if (event.queryStringParameters?.sort) {
			sort = JSON.parse(event.queryStringParameters?.sort);
		}

		const page = Math.max(1, pageNumber);

		const params: ScanCommandInput = {
			TableName: tableName,
		};

		if (event.queryStringParameters?.search) {
			params.FilterExpression =
				'contains(#name, :searchTerm) OR contains(#address, :searchTerm) OR contains(#industry, :searchTerm) ';
			params.ExpressionAttributeNames = {
				'#name': 'name', // Using a placeholder for the reserved keyword
				'#address': 'address',
				'#industry': 'industry',
			};
			params.ExpressionAttributeValues = {
				':searchTerm': event.queryStringParameters?.search,
			};
		}

		if (event.queryStringParameters?.limit) {
			params.Limit = parseInt(event.queryStringParameters?.limit, 10);
		}

		if (event.queryStringParameters?.lastEvaluatedKey) {
			params.ExclusiveStartKey = JSON.parse(
				event.queryStringParameters?.lastEvaluatedKey,
			);
		}

		return await fetchItemsWithPagination(params, page, sort);
	} catch (error) {
		console.error('Error fetching items: ', error);

		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'An unknown error has occurred.',
			}),
		};
	}
};
