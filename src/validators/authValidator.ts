import * as yup from 'yup';

export const memberRegisterSchema = yup.object().shape({
  full_name: yup.string().required('Full Name is required'),
  father_name: yup.string().required("Father's Name is required"),
  date_of_birth: yup.string().required('Date of Birth is required'),
  gender: yup.string().oneOf(['MALE', 'FEMALE', 'OTHER']).required('Gender is required'),
  country_code: yup.string().required('Country Code is required'),
  phone_number: yup.string().matches(/^[0-9+\-\s()]{7,20}$/, 'Invalid mobile phone number').required('Phone number is required'),
  email: yup.string().email('Invalid email address').required('Email address is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  blood_group: yup.string().optional(),
  profile_image: yup.string().nullable().optional(),
  aadhaar_number: yup.string().required('Aadhaar number is required'),
  voter_id: yup.string().required('Voter ID is required'),
  state_id: yup.number().positive().optional(),
  parliament_constituency_id: yup.number().positive().required('Parliament Constituency is required'),
  assembly_constituency_id: yup.number().positive().nullable().optional(),
  district_id: yup.number().positive().required('District selection is required'),
  block_id: yup.number().positive().required('Block selection is required'),
  village_id: yup.number().positive().nullable().optional(),
  village_custom: yup.string().nullable().optional(),
  address_line1: yup.string().nullable().optional(),
  role_id: yup.number().positive().optional(),
});

export const loginSchema = yup.object().shape({
  login: yup.string().required('Email or Mobile number is required'),
  password: yup.string().required('Password is required'),
});

export const changePasswordSchema = yup.object().shape({
  current_password: yup.string().required('Current password is required'),
  new_password: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
});
