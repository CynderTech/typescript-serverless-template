/* eslint-disable import/no-extraneous-dependencies */
import {
	APIGatewayProxyEvent,
	// Context
} from 'aws-lambda';

const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
	DynamoDBDocumentClient,
	UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

// Initialize clients for S3 and DynamoDB
const s3Client = new S3Client({});
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// S3 Bucket and DynamoDB Table Name
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE_NAME || '';

module.exports.handle = async (
	event: APIGatewayProxyEvent,
	// context: Context,
) => {
	const fileData = JSON.parse(event.body || ''); // Assuming you get the file metadata in the body
	const params = event.pathParameters;

	const domain = event.requestContext.domainPrefix;

	const { fileContent, fileName, fileType } = fileData;

	if (!fileName || !fileContent || !fileType) {
		return {
			statusCode: 400,
			body: JSON.stringify({ message: 'Missing file data' }),
		};
	}

	const key = `${domain}/${fileName}`;

	// Step 1: Upload the file to S3
	const uploadParams = {
		Bucket: BUCKET_NAME,
		Key: key,
		Body: Buffer.from(fileContent, 'base64'), // Assuming the file content is base64 encoded
		ContentType: fileType,
	};

	try {
		// Upload the file to S3
		const uploadCommand = new PutObjectCommand(uploadParams);

		await s3Client.send(uploadCommand);

		// // Step 2: Store file metadata in DynamoDB
		// const fileMetadata = {
		// 	fileName,
		// 	fileSize: fileContent.length, // Size in bytes
		// 	s3Url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
		// 	uploadedAt: new Date().toISOString(),
		// };

		const fileMetadata = fileName;

		const updateExpression = 'set image = :image';
		const expressionAttributeValues = {
			':image': fileMetadata,
		};

		const dynamoDbParams = {
			TableName: TABLE_NAME,
			Key: {
				name: (params && params.name) || '',
			},
			UpdateExpression: updateExpression,
			ExpressionAttributeValues: expressionAttributeValues,
			ReturnValues: 'ALL_NEW',
		};

		const dynamoDbCommand = new UpdateCommand(dynamoDbParams);
		await docClient.send(dynamoDbCommand);

		// Return success response
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'File uploaded and metadata stored successfully!',
				s3Url: fileMetadata.s3Url,
			}),
		};
	} catch (error) {
		console.error('Error uploading file:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'Error uploading file',
				error: error.message,
			}),
		};
	}
};
