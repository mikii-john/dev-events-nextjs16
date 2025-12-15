import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Event, { IEvent } from '@/database/event.model';

interface EventBySlugParams {
  slug: string;
}

/**
 * GET /api/events/[slug]
 * Fetch a single event by its slug.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<EventBySlugParams> },
) {
  try {
    const { slug: rawSlug } = await context.params;

    // Basic validation for presence and shape of slug
    if (!rawSlug || typeof rawSlug !== 'string') {
      return NextResponse.json(
        { message: 'Missing or invalid slug parameter' },
        { status: 400 },
      );
    }

    const slug = rawSlug.toLowerCase().trim();

    if (!slug) {
      return NextResponse.json(
        { message: 'Slug cannot be empty' },
        { status: 400 },
      );
    }

    // Optional: enforce allowed characters for extra safety
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      return NextResponse.json(
        { message: 'Slug may only contain lowercase letters, numbers, and hyphens' },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const event: IEvent | null = await Event.findOne({ slug }).lean<IEvent | null>();

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: 'Event fetched successfully', event },
      { status: 200 },
    );
  } catch (error: unknown) {
    // Mongoose-specific errors (e.g., connection issues, cast errors)
    if (error instanceof mongoose.Error) {
      return NextResponse.json(
        {
          message: 'Database error while fetching event',
          error: error.message,
        },
        { status: 500 },
      );
    }

    // Fallback for unexpected errors
    return NextResponse.json(
      {
        message: 'Unexpected error while fetching event',
        error: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 },
    );
  }
}
