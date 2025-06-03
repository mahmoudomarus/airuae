#!/bin/bash
set -e

echo "Creating S3 bucket for the application..."
awslocal s3 mb s3://airuae-uploads

echo "Setting bucket policy to public-read..."
awslocal s3api put-bucket-policy --bucket airuae-uploads --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::airuae-uploads/*"]
    }
  ]
}'

echo "S3 bucket created and configured successfully!"
