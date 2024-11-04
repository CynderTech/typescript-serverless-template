/* eslint-disable import/no-extraneous-dependencies */
import {
	APIGatewayProxyEvent,
	// Context
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

module.exports.handle = async (
	event: APIGatewayProxyEvent,
	// context: Context,
) => {
	const client = new DynamoDBClient({});
	const docClient = DynamoDBDocumentClient.from(client);

	try {
		const params = event.pathParameters;

		const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || '';

		const deleteParams = new DeleteCommand({
			TableName: tableName,
			Key: {
				name: (params && params.name) || '',
			},
		});

		const result = await docClient.send(deleteParams);

		return {
			statusCode: 200,
			body: JSON.stringify({
				...result,
				message: 'Organization deleted successfully.',
			}),
		};
	} catch (error) {
		console.error('Error deleting item: ', error);

		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'An unknown error has occurred.',
			}),
		};
	}
};
