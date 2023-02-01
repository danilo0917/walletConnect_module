import Joi from 'joi';
import type { UauthInitOptions } from './types.js';
type ValidateReturn = Joi.ValidationResult | null;
export declare const validateUauthInitOptions: (data: UauthInitOptions) => ValidateReturn;
export {};
