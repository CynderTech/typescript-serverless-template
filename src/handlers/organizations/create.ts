/* eslint-disable import/no-extraneous-dependencies */
import {
	APIGatewayProxyEvent,
	// Context
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

module.exports.handle = async (
	event: APIGatewayProxyEvent,
	// context: Context,
) => {
	const client = new DynamoDBClient({});
	const docClient = DynamoDBDocumentClient.from(client);

	try {
		const body = JSON.parse(event.body || '');
		const { ...payload } = body;

		const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || '';

		const putParams = new PutCommand({
			TableName: tableName,
			Item: {
				name: payload.name,
				address: payload.address,
				industry: payload.industry,
				isActive: payload.isActive,
				sortingKey: payload.sortingKey,
			},
		});

		const result = await docClient.send(putParams);

		return {
			statusCode: 200,
			body: JSON.stringify({
				...result,
				message: 'Organization created successfully.',
			}),
		};
	} catch (error) {
		console.error('Error creating item: ', error);

		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'An unknown error has occurred.',
			}),
		};
	}
};
