import { S3Client, ListObjectsCommand, PutObjectCommand, CopyObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import * as aiplatform from '@google-cloud/aiplatform';
import { google } from "googleapis";
import config from '../config'

const sharp = require("sharp");
const replaceColor = require('replace-color')
var fs = require('fs')
const Jimp = require('jimp');

import clustering from 'density-clustering';
import hull from 'hull.js'

// Set the AWS Region.
const REGION = "sfo3"; //e.g. "us-east-1"
// Create an Amazon S3 service client object.
var s3clientObject = {
    region: REGION,
    endpoint: `https://${config.SPACES_ENDPOINT}`,
    forcePathStyle: false,
    credentials: {
        accessKeyId: config.DO_SPACE_KEY,
        secretAccessKey: config.DO_SPACE_SECRET
    }
}
const s3Client = new S3Client(s3clientObject);

export const DoGetObject = async (bucket: string, key: string): Promise<any> => {
    let bucketParams = {
        Bucket: bucket,
        Key: key,
    };
    try {
        const response = s3Client.send(new GetObjectCommand(bucketParams));
        return response;
    } catch (err) {
        console.log("Error", err);
        return Promise.resolve(err)
    }
};

const endpointId = "4187446053919784960";
const project = 'tulipaimlserver';
const location = 'us-central1';

const clientOptions = {
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};

export const GcpTongueAnalysisGetPredictionStorage = async (bucket: string, key: string) => {
    console.log(new Date().toISOString());

    var doObject = await DoGetObject(bucket, key);
    var content = await doObject?.Body?.transformToByteArray() as Uint8Array;
    console.log(new Date().toISOString());

    return GcpTongueAnalysisGetPrediction(content);
}

export const GcpTongueAnalysisGetPrediction = async (content: Uint8Array) => {
    const { instance, params, prediction } = aiplatform.protos.google.cloud.aiplatform.v1.schema.predict;
    const { PredictionServiceClient } = aiplatform.v1;
    const predictionServiceClient = new PredictionServiceClient(clientOptions);

    var generateExplanation = true;

    console.log('pred begin' + new Date().toISOString());
    var contentRsz = await sharp(content)
        .resize({ width: 205 })
        .withMetadata()
        .toBuffer();
    var b64 = Buffer.from(contentRsz!).toString('base64');
    // b64 = fs.readFileSync('ok2.jpg')
    const image = b64;

    const endpoint = `projects/${project}/locations/${location}/endpoints/${endpointId}`;

    const parametersObj = new params.ImageClassificationPredictionParams({
        confidenceThreshold: 0.5,
        maxPredictions: 5,
    }) as any;
    const parameters = parametersObj.toValue();

    const instanceObj = new instance.ImageClassificationPredictionInstance({
        content: image,
    }) as any;
    const instanceValue = instanceObj.toValue();

    const instances = [instanceValue];
    const request = {
        endpoint,
        instances,
        parameters,
        timeout: 5 * 60 * 1000,
    };

    const [response] = generateExplanation ? await predictionServiceClient.explain(request) : await predictionServiceClient.predict(request);
    const predictions = response.predictions;
    // console.log('Predict image classification response');
    // console.log(`\tDeployed model id : ${response.deployedModelId}`);
    // console.log(response)
    // console.log(response.predictions)
    // console.log(response.predictions[0])
    // console.log(response.predictions[0].structValue.fields.confidences)
    // console.log('\tPredictions :');
    for (const predictionValue of predictions!) {
        const predictionResultObj =
            (prediction.ClassificationPredictionResult as any).fromValue(predictionValue);
        for (const [i, label] of predictionResultObj.displayNames.entries()) {
            // console.log(`\tDisplay name: ${key}`);
            console.log(`\tDisplay name: ${label}`);
            console.log(`\tConfidences: ${predictionResultObj.confidences[i]}`);
            console.log(`\tIDs: ${predictionResultObj.ids[i]}\n\n`);
        }
    }


    let result: any = {};
    if (predictions != null && predictions != undefined && predictions.length > 0) {
        result.originalImage = b64;
        if (generateExplanation) {
            var otherExp = (response as aiplatform.protos.google.cloud.aiplatform.v1.IExplainResponse);
            var spec = otherExp.explanations![0].attributions![0].featureAttributions?.structValue?.fields?.image?.structValue?.fields?.b64_jpeg.stringValue;
            var imgbuf = Buffer.from(spec as string, 'base64')
            var hulls = await genHulls(imgbuf);

            // Add to result
            var img2 = await addExplanation(imgbuf, contentRsz);
            var enc = img2.toString('base64');
            result.explanationImage = enc;
            result.explanationAnalysis = otherExp.explanations;
            result.explanationAnalysisHulls = hulls;
        }

        result.pred = predictions[0].structValue?.fields?.displayNames?.listValue?.values;
        result.conf = predictions[0].structValue?.fields?.confidences?.listValue?.values;
    }
    console.log('pred-end ' + new Date().toISOString());

    return result;
}



const addExplanation = async function (explanationBuffer: any, originalBuffer: any): Promise<Buffer> {
    // console.log(await sharp(buf1).metadata())
    return new Promise(async (resolve, reject) => {

        var img = await sharp(explanationBuffer)
            .ensureAlpha()
            .withMetadata()
            .toBuffer();
        replaceColor({
            image: img,
            colors: {
                type: 'hex',
                targetColor: '#000000',
                replaceColor: '#00000000'
            }
        }, (err: any, jimpObject: any) => {
            if (err) { return reject(err) }
            jimpObject.getBuffer(Jimp.MIME_PNG, async (err: any, buffer: any) => {
                var img2 = await sharp(originalBuffer)
                    .ensureAlpha()
                    .composite([
                        {
                            input: buffer,
                            blend: 'add'
                        },
                    ])
                    .withMetadata()
                    .toBuffer();
                resolve(img2)
            });
        });
    });
}

const genHulls = async (imgBuffer: Buffer) => {
    var { width, height } = await sharp(imgBuffer).metadata();
    console.log(width, height)
    const { data, info } = await sharp(imgBuffer)
        .threshold(10)
        .raw()
        .toBuffer({ resolveWithObject: true })

    var dataset = [...data]
        .filter((x, i) => i % 3 == 0)
        .map((x, i) => [i % width, Math.floor(i / width), x])
        .filter(x => x[2] > 0)
        .map(x => [x[0], x[1]])
        ;

    var clus = new clustering.DBSCAN();
    var clusters = clus.run(dataset, 5, 3);
    const coordinates = clusters.map((clu: any) => clu.map((index: any) => dataset[index]));
    const hulls = coordinates.map((x: any) => hull(x, 50));
    console.log('clusters,hulls', hulls.length, coordinates.length)
    return {height, width, hulls};
}
