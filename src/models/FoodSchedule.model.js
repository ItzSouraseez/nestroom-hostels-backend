const mongoose = require("mongoose");

const mealFeedbackSchema = new mongoose.Schema(
  {
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    residentName: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Snacks"],
      required: true,
    },
    time: { type: String, default: null }, // "08:00-09:00"
    menu: [{ type: String }],
    ingredients: [{ type: String }],
    calories: { type: Number, default: null },
    dietaryTags: [{ type: String }], // ["Vegetarian", "GlutenFree"]
    servingSize: { type: String, default: null },
    preparedBy: { type: String, default: null },

    feedback: [mealFeedbackSchema],
    averageRating: { type: Number, default: 0 },
    totalFeedback: { type: Number, default: 0 },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    date: { type: Date },
    meals: [mealSchema],
  },
  { _id: false }
);

const alternativeMealSchema = new mongoose.Schema(
  {
    mainMeal: String,
    alternativeMeal: String,
    availableFor: [{ type: String }],
  },
  { _id: false }
);

const foodScheduleSchema = new mongoose.Schema(
  {
    foodScheduleId: { type: String, required: true, unique: true, trim: true },

    // ── Reference ─────────────────────────────────────────────────────────────
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },

    // ── Week ──────────────────────────────────────────────────────────────────
    weekNumber: { type: Number, required: true },
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },

    // ── Daily Schedule (7 days) ───────────────────────────────────────────────
    schedule: [dayScheduleSchema],

    // ── Dietary Flags ─────────────────────────────────────────────────────────
    isVegetarian: { type: Boolean, default: true },
    isNonVegetarian: { type: Boolean, default: false },
    hasVeganOptions: { type: Boolean, default: false },
    hasGlutenFreeOptions: { type: Boolean, default: false },
    hasHalal: { type: Boolean, default: false },

    // ── Management ────────────────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    publishedAt: { type: Date, default: null },

    // ── Notes ─────────────────────────────────────────────────────────────────
    specialNotes: { type: String, default: null },
    alternativeMeals: [alternativeMealSchema],
  },
  { timestamps: true }
);

foodScheduleSchema.index({ hostelId: 1 });
foodScheduleSchema.index({ weekStartDate: -1 });
foodScheduleSchema.index({ hostelId: 1, weekStartDate: -1 });

module.exports = mongoose.model("FoodSchedule", foodScheduleSchema);
