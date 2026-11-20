export const getPhoneNumberFromParams = (phoneNumber) => {
  if (Array.isArray(phoneNumber)) return phoneNumber[0] ?? '';
  return phoneNumber ?? '';
};
