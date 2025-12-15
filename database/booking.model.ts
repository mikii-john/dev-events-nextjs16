import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { Event } from './event.model';

// Core attributes required to create a booking
export interface BookingAttrs {
  eventId: Types.ObjectId;
  email: string;
}

// Full Booking document type as returned by Mongoose
export interface BookingDocument extends Document, BookingAttrs {
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingModel extends Model<BookingDocument> {}

const bookingSchema = new Schema<BookingDocument, BookingModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true, // index for faster queries by event
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true, // automatically manages createdAt and updatedAt
    versionKey: false,
  },
);

// Explicit index on eventId for read-heavy booking queries
bookingSchema.index({ eventId: 1 });

// Lightweight email validation for common formats
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pre-save hook: validate email format and ensure referenced event exists
bookingSchema.pre('save', async function (next) {
  const booking = this as BookingDocument;

  // Validate email format early to avoid unnecessary DB work
  if (!EMAIL_REGEX.test(booking.email)) {
    return next(new Error('Email is not in a valid format.'));
  }

  // Ensure the referenced event exists before allowing the booking to be saved
  try {
    const eventExists = await Event.exists({ _id: booking.eventId });

    if (!eventExists) {
      return next(new Error('Referenced event does not exist.'));
    }
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error('Failed to validate event reference.');
    return next(normalizedError);
  }

  return next();
});

// Reuse existing model during HMR in development to avoid model overwrite errors
export const Booking: BookingModel =
  models.Booking || model<BookingDocument, BookingModel>('Booking', bookingSchema);
