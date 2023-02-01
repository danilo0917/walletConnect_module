import Joi from 'joi';
export declare type ValidateReturn = Joi.ValidationResult | null;
export declare function validate(validator: Joi.Schema, data: unknown): ValidateReturn;
export declare const chainIdValidation: Joi.AlternativesSchema;
export declare const chainNamespaceValidation: Joi.StringSchema;
/** Related to ConnectionInfo from 'ethers/lib/utils' */
export declare const providerConnectionInfoValidation: Joi.ObjectSchema<any>;
export declare const chainValidation: Joi.ObjectSchema<any>;
