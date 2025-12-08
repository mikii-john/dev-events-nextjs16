import { Schema, model, models, Document, Model } from 'mongoose';

// Core attributes required to create an Event
export interface EventAttrs {
  title: string;
  slug?: string; // generated from title
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  // Stored as ISO-like date string (YYYY-MM-DD) for easy filtering and display
  date: string;
  // Stored as 24h time string (HH:MM)
  time: string;
  mode: string; // e.g. "online", "offline", "hybrid"
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
}

// Full Event document type as returned by Mongoose
export interface EventDocument extends Document, EventAttrs {
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventModel extends Model<EventDocument> {}

const eventSchema = new Schema<EventDocument, EventModel>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: {
      type: [String],
      required: true,
      // Ensure agenda is a non-empty array of non-empty strings
      validate: {
        validator(value: string[]): boolean {
          return (
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((item) => typeof item === 'string' && item.trim().length > 0)
          );
        },
        message: 'Agenda must be a non-empty array of non-empty strings.',
      },
    },
    organizer: { type: String, required: true, trim: true },
    tags: {
      type: [String],
      required: true,
      // Ensure tags is a non-empty array of non-empty strings
      validate: {
        validator(value: string[]): boolean {
          return (
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((item) => typeof item === 'string' && item.trim().length > 0)
          );
        },
        message: 'Tags must be a non-empty array of non-empty strings.',
      },
    },
  },
  {
    timestamps: true, // automatically manages createdAt and updatedAt
    versionKey: false,
  },
);

// Unique index on slug for fast lookups and to enforce uniqueness at the DB level
eventSchema.index({ slug: 1 }, { unique: true });

// Generate a URL-friendly slug from the event title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '') // remove quotes
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}

// Normalize a date string to YYYY-MM-DD (UTC) for consistency
function normalizeDate(input: string): string {
  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date format. Expected a parsable date string.');
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Normalize time to HH:MM (24-hour) format and validate the range
function normalizeTime(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    throw new Error('Invalid time format. Expected HH:MM (24-hour).');
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time value. Hours must be 0–23 and minutes 0–59.');
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Pre-save hook: slug generation, date/time normalization, and validation of required fields
eventSchema.pre('save', function (next) {
  const event = this as EventDocument;

  // Validate that all required string fields are present and non-empty
  const requiredStringFields: (keyof EventAttrs)[] = [
    'title',
    'description',
    'overview',
    'image',
    'venue',
    'location',
    'date',
    'time',
    'mode',
    'audience',
    'organizer',
  ];

  for (const field of requiredStringFields) {
    const value = event[field];

    if (typeof value !== 'string' || value.trim().length === 0) {
      return next(new Error(`Field "${field}" is required and must be a non-empty string.`));
    }
  }

  // Normalize and validate date and time
  try {
    event.date = normalizeDate(event.date);
    event.time = normalizeTime(event.time);
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error('Invalid date/time value.');
    return next(normalizedError);
  }

  // Generate or regenerate slug only when the title has changed
  if (event.isModified('title') || !event.slug) {
    event.slug = generateSlug(event.title);
  }

  return next();
});

// Reuse existing model during HMR in development to avoid model overwrite errors
export const Event: EventModel = models.Event || model<EventDocument, EventModel>('Event', eventSchema);
