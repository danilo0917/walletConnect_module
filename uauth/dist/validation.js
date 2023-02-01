import Joi from 'joi';
const uauthOptions = Joi.object({
    clientID: Joi.string().required(),
    redirectUri: Joi.string().required(),
    scope: Joi.string().allow(null),
    shouldLoginWithRedirect: Joi.boolean().allow(null),
    bridge: Joi.string().allow(null),
    qrcodeModalOptions: {
        mobileLinks: Joi.array().allow(null)
    },
    connectFirstChainId: Joi.boolean().allow(null)
});
const validate = (validator, data) => {
    const result = validator.validate(data);
    return result.error ? result : null;
};
export const validateUauthInitOptions = (data) => {
    return validate(uauthOptions, data);
};
