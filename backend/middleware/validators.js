const Joi = require('joi');
const { ROLES, COURSES, SEMESTERS, ATTENDANCE_STATUS } = require('../config/constants');

/**
 * Validation middleware factory
 * Wraps Joi schemas and returns Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }
    
    // Replace request body/params/query with validated and sanitized values
    req[property] = value;
    next();
  };
};

// ========================
// Auth Validation Schemas
// ========================

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),
  
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required',
    }),
  
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required()
    .messages({
      'any.only': `Role must be one of: ${Object.values(ROLES).join(', ')}`,
      'any.required': 'Role is required',
    }),
  
  course: Joi.when('role', {
    is: ROLES.STUDENT,
    then: Joi.string()
      .valid(...COURSES)
      .required()
      .messages({
        'any.only': `Course must be one of: ${COURSES.join(', ')}`,
        'any.required': 'Course is required for students',
      }),
    otherwise: Joi.string().optional(),
  }),
  
  semester: Joi.when('role', {
    is: ROLES.STUDENT,
    then: Joi.number()
      .integer()
      .min(1)
      .max(8)
      .required()
      .messages({
        'number.min': 'Semester must be at least 1',
        'number.max': 'Semester cannot exceed 8',
        'any.required': 'Semester is required for students',
      }),
    otherwise: Joi.number().optional(),
  }),
  
  faceDescriptor: Joi.array()
    .items(Joi.number())
    .length(128)
    .required()
    .messages({
      'array.length': 'Invalid face descriptor',
      'any.required': 'Face capture is required',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

// ========================
// Attendance Validation Schemas
// ========================

const markAttendanceSchema = Joi.object({
  classId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid class ID',
      'any.required': 'Class ID is required',
    }),
  
  faceDescriptor: Joi.array()
    .items(Joi.number())
    .length(128)
    .required()
    .messages({
      'array.length': 'Invalid face descriptor',
      'any.required': 'Face capture is required',
    }),
  
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.min': 'Invalid latitude',
      'number.max': 'Invalid latitude',
      'any.required': 'Location (latitude) is required',
    }),
  
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.min': 'Invalid longitude',
      'number.max': 'Invalid longitude',
      'any.required': 'Location (longitude) is required',
    }),
});

const updateAttendanceSchema = Joi.object({
  classId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid class ID',
      'any.required': 'Class ID is required',
    }),
  
  studentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid student ID',
      'any.required': 'Student ID is required',
    }),
  
  present: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Attendance status (present) is required',
    }),
  
  reason: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters',
    }),
});

// ========================
// Class Validation Schemas
// ========================

const createClassSchema = Joi.object({
  subject: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid subject ID',
      'any.required': 'Subject is required',
    }),
  
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required',
    }),
  
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:mm format (24-hour)',
      'any.required': 'Start time is required',
    }),
  
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:mm format (24-hour)',
      'any.required': 'End time is required',
    }),
  
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.min': 'Invalid latitude',
      'number.max': 'Invalid latitude',
      'any.required': 'Location (latitude) is required',
    }),
  
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.min': 'Invalid longitude',
      'number.max': 'Invalid longitude',
      'any.required': 'Location (longitude) is required',
    }),
});

const cancelClassSchema = Joi.object({
  classId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid class ID',
      'any.required': 'Class ID is required',
    }),
  
  reason: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required()
    .messages({
      'string.min': 'Cancellation reason must be at least 5 characters',
      'string.max': 'Cancellation reason cannot exceed 500 characters',
      'any.required': 'Cancellation reason is required',
    }),
});

// ========================
// Admin Validation Schemas
// ========================

const assignTeacherSchema = Joi.object({
  teacherId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid teacher ID',
      'any.required': 'Teacher ID is required',
    }),
  
  subjectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid subject ID',
      'any.required': 'Subject ID is required',
    }),
});

// ========================
// Query Validation Schemas
// ========================

const objectIdParamSchema = Joi.object({
  classId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),
});

const teacherStudentsQuerySchema = Joi.object({
  course: Joi.string().required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  subject: Joi.string().required(),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  overall: Joi.string().valid('true', 'false').optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  markAttendanceSchema,
  updateAttendanceSchema,
  createClassSchema,
  cancelClassSchema,
  assignTeacherSchema,
  objectIdParamSchema,
  teacherStudentsQuerySchema,
};

