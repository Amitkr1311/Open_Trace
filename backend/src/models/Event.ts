import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  sessionId: string;
  eventType: 'page_view' | 'click';
  pageUrl: string;
  timestamp: Date;
  meta: {
    x?: number;
    y?: number;
  };
}

const EventSchema = new Schema<IEvent>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['page_view', 'click'],
    },
    pageUrl: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    meta: {
      x: { type: Number, default: null },
      y: { type: Number, default: null },
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for heatmap queries
EventSchema.index({ pageUrl: 1, eventType: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
