/**
 * @interface S3Config
 * @description Configuration options for S3 client
 */
export interface S3Config {
    /** AWS access key ID */
    aws_s3_access_key?: string;
    /** AWS secret access key */
    aws_s3_secret_key?: string;
    /** AWS region */
    aws_s3_bucket_region?: string;
    /** Optional AWS endpoint URL for custom endpoints */
    aws_s3_endpoint_url?: string;
    /** Additional S3 client options */
    custom_options?: Record<string, any>;
}
