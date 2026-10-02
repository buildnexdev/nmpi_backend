import * as yup from 'yup';

export const memberRegisterSchema = yup.object().shape({
  full_name: yup.string().required('Full Name is required'),
  father_name: yup.string().required("Father's Name is required"),
  date_of_birth: yup.string().required('Date of Birth is required'),
  gender: yup.string().oneOf(['MALE', 'FEMALE', 'OTHER']).required('Gender is required'),
  email: yup.string().email('Invalid email address').required('Email address is required'),
  mobile: yup.string().matches(/^[0-9+\-\s()]{7,20}$/, 'Invalid mobile phone number').required('Mobile number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  address_line1: yup.string().required('Address Line 1 is required'),
  address_line2: yup.string().nullable().optional(),
  village: yup.string().required('Village / Town is required'),
  taluk_id: yup.number().positive().required('Taluk selection is required'),
  district_id: yup.number().positive().required('District selection is required'),
  state: yup.string().required('State is required'),
  pincode: yup.string().matches(/^\d{5,10}$/, 'Invalid pincode').required('Pincode is required'),
  membership_type_id: yup.number().positive().required('Membership Type is required'),
  unit_id: yup.number().positive().required('Local Unit is required'),
  consent_terms: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
});

export const loginSchema = yup.object().shape({
  login: yup.string().required('Email or Mobile number is required'),
  password: yup.string().required('Password is required'),
});
