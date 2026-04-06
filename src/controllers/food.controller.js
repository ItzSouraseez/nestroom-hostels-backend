const FoodSchedule = require("../models/FoodSchedule.model");
const Resident = require("../models/Resident.model");

const { asyncHandler, createError } = require("../middlewares/errorHandler");
const { sendSuccess } = require("../utils/responseHelper");
const { generateFoodScheduleId } = require("../utils/idGenerator");

// ─── 12.1 Create/Update Food Schedule ────────────────────────────────────────
const createFoodSchedule = asyncHandler(async (req, res) => {
  const { weekNumber, weekStartDate, weekEndDate, schedule, specialNotes, ...flags } = req.body;

  const hostelId = req.params.hostelId;

  // Upsert by hostelId + weekNumber
  const existing = await FoodSchedule.findOne({ hostelId, weekNumber });
  const foodScheduleId = existing?.foodScheduleId || generateFoodScheduleId();

  const data = {
    foodScheduleId,
    hostelId,
    weekNumber,
    weekStartDate: new Date(weekStartDate),
    weekEndDate: new Date(weekEndDate),
    schedule,
    specialNotes,
    createdBy: req.user._id,
    publishedAt: new Date(),
    ...flags,
  };

  const fs = existing
    ? await FoodSchedule.findByIdAndUpdate(existing._id, { $set: data }, { new: true })
    : await FoodSchedule.create(data);

  return sendSuccess(res, {
    foodScheduleId: fs.foodScheduleId,
    weekNumber,
    message: existing ? "Food schedule updated" : "Food schedule created",
  }, existing ? 200 : 201);
});

// ─── 12.2 Get Current Food Schedule ──────────────────────────────────────────
const getCurrentFoodSchedule = asyncHandler(async (req, res) => {
  const hostelId = req.params.hostelId || (await resolveHostelId(req));

  const today = new Date();
  const schedule = await FoodSchedule.findOne({
    hostelId,
    weekStartDate: { $lte: today },
    weekEndDate: { $gte: today },
  }).lean();

  if (!schedule) throw createError("No food schedule found for current week", 404, "NO_SCHEDULE");

  return sendSuccess(res, { schedule });
});

// ─── 12.3 Get Food Schedule List ─────────────────────────────────────────────
const getFoodSchedules = asyncHandler(async (req, res) => {
  const hostelId = req.params.hostelId || (await resolveHostelId(req));
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [schedules, total] = await Promise.all([
    FoodSchedule.find({ hostelId })
      .select("foodScheduleId weekNumber weekStartDate weekEndDate isVegetarian isNonVegetarian publishedAt")
      .sort({ weekStartDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    FoodSchedule.countDocuments({ hostelId }),
  ]);

  return sendSuccess(res, {
    schedules,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});

// ─── 12.4 Submit Meal Feedback ────────────────────────────────────────────────
const submitMealFeedback = asyncHandler(async (req, res) => {
  const { mealType, rating, comment } = req.body;

  const resident = await Resident.findOne({ userId: req.user._id }).lean();
  if (!resident) throw createError("Resident not found", 404);

  const today = new Date();
  const schedule = await FoodSchedule.findOne({
    hostelId: resident.hostelId,
    weekStartDate: { $lte: today },
    weekEndDate: { $gte: today },
  });
  if (!schedule) throw createError("No active food schedule", 404, "NO_SCHEDULE");

  const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][today.getDay()];
  const daySchedule = schedule.schedule.find((d) => d.dayOfWeek === dayName);
  if (!daySchedule) throw createError("No schedule for today", 404);

  const meal = daySchedule.meals.find((m) => m.mealType === mealType);
  if (!meal) throw createError(`${mealType} not scheduled today`, 404);

  // Check not already rated
  const alreadyRated = meal.feedback?.some((f) => String(f.residentId) === String(resident._id));
  if (alreadyRated) throw createError("You have already rated this meal today", 409, "ALREADY_RATED");

  meal.feedback = meal.feedback || [];
  meal.feedback.push({
    residentId: resident._id,
    residentName: resident.fullName,
    rating,
    comment: comment || null,
    timestamp: new Date(),
  });
  meal.totalFeedback = (meal.totalFeedback || 0) + 1;
  meal.averageRating = parseFloat(
    (meal.feedback.reduce((s, f) => s + f.rating, 0) / meal.feedback.length).toFixed(1)
  );

  await schedule.save();

  return sendSuccess(res, { message: "Meal feedback submitted", averageRating: meal.averageRating });
});

// Helper: resolve hostelId from resident's profile
const resolveHostelId = async (req) => {
  const resident = await Resident.findOne({ userId: req.user._id }).lean();
  if (!resident) throw createError("Resident not found", 404);
  return String(resident.hostelId);
};

module.exports = { createFoodSchedule, getCurrentFoodSchedule, getFoodSchedules, submitMealFeedback };
