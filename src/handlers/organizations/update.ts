/* eslint-disable import/no-extraneous-dependencies */
import {
	APIGatewayProxyEvent,
	// Context
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

module.exports.handle = async (
	event: APIGatewayProxyEvent,
	// context: Context,
) => {
	const client = new DynamoDBClient({});
	const docClient = DynamoDBDocumentClient.from(client);

	try {
		const body = JSON.parse(event.body || '');
		const { ...payload } = body;
		const params = event.pathParameters;

		const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || '';

		let updateExpression = 'set';
		const expressionAttributeValues: any = {};

		if (payload.name) {
			updateExpression += ' name = :name';
			expressionAttributeValues[':name'] = payload.name;
		}

		if (payload.address) {
			updateExpression += ' address = :address';
			expressionAttributeValues[':address'] = payload.address;
		}

		if (payload.industry) {
			updateExpression += ' industry = :industry';
			expressionAttributeValues[':industry'] = payload.industry;
		}

		if (payload.sortingKey) {
			updateExpression += ' sortingKey = :sortingKey';
			expressionAttributeValues[':sortingKey'] = payload.sortingKey;
		}

		if (typeof payload.isActive === 'boolean') {
			updateExpression += ' isActive = :isActive';
			expressionAttributeValues[':isActive'] = payload.isActive;
		}

		const updateParams = new UpdateCommand({
			TableName: tableName,
			Key: {
				name: (params && params.name) || '',
			},
			UpdateExpression: updateExpression,
			ExpressionAttributeValues: expressionAttributeValues,
			ReturnValues: 'ALL_NEW',
		});

		const result = await docClient.send(updateParams);

		return {
			statusCode: 200,
			body: JSON.stringify({
				...result,
				message: 'Organization updated successfully.',
			}),
		};
	} catch (error) {
		console.error('Error updating item: ', error);

		return {
			statusCode: 500,
			body: JSON.stringify({
				// ...result,
				message: 'An unknown error has occurred.',
			}),
		};
	}
};
