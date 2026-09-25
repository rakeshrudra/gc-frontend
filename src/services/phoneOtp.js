import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';
import { firebaseAuth } from './firebase';

let recaptchaVerifier = null;

const getRecaptchaVerifier = (containerId) => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: 'invisible',
    });
  }
  return recaptchaVerifier;
};

const toE164IndianNumber = (mobileNo) => {
  const digitsOnly = mobileNo.replace(/\D/g, '');
  const last10Digits = digitsOnly.slice(-10);
  return `+91${last10Digits}`;
};

export const sendPhoneOtp = async (mobileNo, containerId) => {
  const e164Phone = toE164IndianNumber(mobileNo);
  const verifier = getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(firebaseAuth, e164Phone, verifier);
};

export const confirmPhoneOtp = async (confirmationResult, otp) => {
  const credential = await confirmationResult.confirm(otp);
  const idToken = await credential.user.getIdToken();
  await signOut(firebaseAuth);
  return idToken;
};

export const resetRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};
