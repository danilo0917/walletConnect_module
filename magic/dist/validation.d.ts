import Joi from 'joi';
import type { MagicInitOptions } from './types.js';
declare type ValidateReturn = Joi.ValidationResult | null;
export declare const validateMagicInitOptions: (data: MagicInitOptions) => ValidateReturn;
export declare const validateUserEmail: (email: string) => ValidateReturn;
export {};
