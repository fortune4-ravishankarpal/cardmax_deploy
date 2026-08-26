export const EMPLOYMENT_TYPES = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Self Employed', value: 'self_employed' },
  { label: 'Unemployed', value: 'unemployed' },
  { label: 'Student', value: 'student' },
  { label: 'Retired', value: 'retired' },
  { label: 'Other', value: 'other' },
] as const

export const EMPLOYMENT_TYPE_VALUES = EMPLOYMENT_TYPES.map((option) => option.value)

export const ACCOUNT_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
] as const