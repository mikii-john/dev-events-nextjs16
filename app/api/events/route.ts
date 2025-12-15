import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Event, { EventAttrs } from '@/database/event.model';

// Handle event creation via multipart/form-data POST requests
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();  

    const contentType = req.headers.get('content-type') ?? '';

    let Events;

    if (contentType.includes('application/json')) {
      // Handle JSON body payloads
      const body = (await req.json()) as Partial<EventAttrs> & {
        agenda?: unknown;
        tags?: unknown;
      };

      Events = {
        title: String(body.title ?? '').trim(),
        description: String(body.description ?? '').trim(),
        overview: String(body.overview ?? '').trim(),
        image: String(body.image ?? '').trim(),
        venue: String(body.venue ?? '').trim(),
        location: String(body.location ?? '').trim(),
        date: String(body.date ?? '').trim(),
        time: String(body.time ?? '').trim(),
        mode: String(body.mode ?? '').trim(),
        audience: String(body.audience ?? '').trim(),
        organizer: String(body.organizer ?? '').trim(),
        agenda: Array.isArray(body.agenda)
          ? body.agenda.map((value) => String(value).trim())
          : [],
        tags: Array.isArray(body.tags)
          ? body.tags.map((value) => String(value).trim())
          : [],
      };
    } else {
      // Handle multipart/form-data or URL-encoded payloads
      const formData = await req.formData();
      const imageEntry = formData.get('image');
      let imageUrl = '';
      
      // Declare variables in the correct scope so they are available for Events object
      let parsedTags: string[] = [];
      let parsedAgenda: string[] = [];

      if (imageEntry && typeof imageEntry === 'object' && (imageEntry as File).name) {
        // It's a file
        const file = imageEntry as File;

        try {
          const tagsRaw = formData.get('tags');
          if (tagsRaw) {
              const parsed = JSON.parse(String(tagsRaw));
              parsedTags = Array.isArray(parsed) ? parsed : [];
          }
        } catch (e) {
             // Fallback
             parsedTags = formData.getAll('tags').map((value) => String(value).trim());
        }

        try {
          const agendaRaw = formData.get('agenda');
          if (agendaRaw) {
              const parsed = JSON.parse(String(agendaRaw));
              parsedAgenda = Array.isArray(parsed) ? parsed : [];
          }
        } catch (e) {
             // Fallback
             parsedAgenda = formData.getAll('agenda').map((value) => String(value).trim());
        }
  
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        imageUrl = await new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'event_images',
              format: 'webp',
              unique_filename: true,
              use_filename: true,
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result?.secure_url || '');
              }
            }
          );
          stream.end(buffer);
        });
      } else {
        // It's a string or nothing
        imageUrl = String(imageEntry ?? '').trim();
        
         try {
            const tagsRaw = formData.get('tags');
            if (tagsRaw && typeof tagsRaw === 'string') {
                const parsed = JSON.parse(tagsRaw);
                parsedTags = Array.isArray(parsed) ? parsed : [];
            }
         } catch(e) { parsedTags = formData.getAll('tags').map(String); }

         try {
            const agendaRaw = formData.get('agenda');
             if (agendaRaw && typeof agendaRaw === 'string') {
                const parsed = JSON.parse(agendaRaw);
                parsedAgenda = Array.isArray(parsed) ? parsed : [];
            }
         } catch(e) { parsedAgenda = formData.getAll('agenda').map(String); }
      }

      if (!imageUrl) {
        return NextResponse.json(
          { message: 'Image file or URL is required' },
          { status: 400 }
        );
      }

      Events = {
        title: String(formData.get('title') ?? '').trim(),
        description: String(formData.get('description') ?? '').trim(),
        overview: String(formData.get('overview') ?? '').trim(),
        image: imageUrl,
        venue: String(formData.get('venue') ?? '').trim(),
        location: String(formData.get('location') ?? '').trim(),
        date: String(formData.get('date') ?? '').trim(),
        time: String(formData.get('time') ?? '').trim(),
        mode: String(formData.get('mode') ?? '').trim(),
        audience: String(formData.get('audience') ?? '').trim(),
        organizer: String(formData.get('organizer') ?? '').trim(),
        agenda: parsedAgenda.length > 0 ? parsedAgenda : formData.getAll('agenda').map((value) => String(value).trim()),
        tags: parsedTags.length > 0 ? parsedTags : formData.getAll('tags').map((value) => String(value).trim()),
      };
    }

    // slug is optional; the Event schema pre-save hook will generate it from title
    const createdEvent = await Event.create(Events);

    return NextResponse.json(
      { message: 'Event created successfully', event: createdEvent },
      { status: 201 },
    );
  } catch (error) {
    // Surface validation errors as 400-level responses
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          error: error.message,
        },
        { status: 400 },
      );
    }

    // Handle duplicate key error (E11000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 11000) {
      return NextResponse.json(
        {
          message: 'Event with this title already exists',
          error: 'Duplicate key error',
        },
        { status: 409 },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        message: 'Event creation Failed',
        error: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const events = await Event.find().sort({ createdAt: -1 });
    return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: 'Failed to fetch events',
        error: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 },
    );
  }
}