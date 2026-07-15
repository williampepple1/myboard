'use server'

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import prisma from "@/lib/prisma"

// S3 initialization moved inside the function to prevent module-level crashes

export async function uploadOrganizationLogo(orgId: string, formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      throw new Error("No file provided")
    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds the 2MB limit.")
    }

    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ''
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      throw new Error("Cloudflare R2 is not fully configured. Please ensure R2_PUBLIC_URL and all other credentials are in your environment variables.")
    }

    const S3 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = file.name.split('.').pop()
    const fileName = `logos/${orgId}-${Date.now()}.${extension}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })

    await S3.send(command)

    // Build the final public URL
    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${fileName}`

    // Save to database
    await prisma.organization.update({
      where: { id: orgId },
      data: { logoUrl: publicUrl },
    })

    return { success: true, url: publicUrl }
  } catch (error: unknown) {
    console.error("Error uploading logo:", error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error("Failed to upload image")
  }
}
