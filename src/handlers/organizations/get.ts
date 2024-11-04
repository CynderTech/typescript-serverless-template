/* eslint-disable import/no-extraneous-dependencies */
import {
	APIGatewayProxyEvent,
	// Context
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

module.exports.handle = async (
	event: APIGatewayProxyEvent,
	// context: Context,
) => {
	const client = new DynamoDBClient({});
	const docClient = DynamoDBDocumentClient.from(client);

	try {
		const params = event.pathParameters;

		const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || '';

		const getParams = new GetCommand({
			TableName: tableName,
			Key: {
				name: (params && params.name) || '',
			},
		});

		const result = await docClient.send(getParams);

		if (!result.Item) {
			return {
				statusCode: 404,
				message: 'Not Found',
			};
		}

		return {
			statusCode: 200,
			body: JSON.stringify(result.Item),
		};
	} catch (error) {
		console.error('Error fetching item: ', error);

		return {
			statusCode: 500,
			body: JSON.stringify({
				// ...result,
				message: 'An unknown error has occurred.',
			}),
		};
	}
};
