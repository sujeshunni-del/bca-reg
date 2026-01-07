import { Applicant, Country, Staff } from '../types';

// Configuration provided by the user
const CLICKUP_CONFIG = {
  apiKey: 'pk_260468481_S4KLO3ZGV6P1PL1POHKXNS1LA5ISSG0P',
  
  lists: {
    profileCreation: '901814727530',
    visa: '901814730704',
    user: '901814735410'
  },

  // Field IDs
  fields: {
    // Shared / Profile
    customer_id: '1c82819f-441e-4a4d-9e49-178f411678f8',
    password: '7f7c5b14-2a6d-4082-975f-d9f78982901d',
    role: '751e69f7-abd4-4da2-927d-df5aff0830c4',
    designation: '493fab15-7086-40cd-9648-311bbc3dfc1a',
    phone: '5788588a-e1a5-4b4e-b900-42e1b5dd7822',
    alt_phone: '343cabc5-9af5-48ca-a54e-f5bffd8c245d',
    email: '2e18821e-1c19-4de5-afb8-77ff11ee6327',
    cost: 'a317dee6-d60f-4107-b989-8af60ab6cd78',
    nationality: '4402d5e4-93b4-447e-8647-3417abf1a6e2',
    apply_country: '8c370b02-cfe5-48e2-879c-9ad34d3f25e7',
    discount_name: '65a86e67-7750-4706-bbf5-0068192350ee',
    grand_total: '9cc78971-82ea-439e-b2a4-30cde167183a', // Brand Total
    job_title: '410dd336-f23f-4893-859f-d04e420f6431',
    reg_fee: '0c4d60c4-56a9-4836-9360-6609b3ae8082',
    vat: '45ddb7c9-6b61-467d-95a0-d870a704dfb8',
    visa_name: 'fc2f03f2-5efc-46f1-84c3-f2eaa442d72d',
    advisor: 'a220503d-5a45-4f0b-b83d-6547a28ca0b5',
    discount_amount: '3d35cc71-402f-473a-9f52-d269d5f896c3',
    application_date: 'ab0db3a0-6b1e-44fd-9ff3-692168c0cc1b',
    ref_id: 'c3742a3d-db81-4aaa-b13b-50fafe0b82e5',
    surname: '34d446a2-fe50-45bc-8e3b-64660ebdd6f7',
    status: '74a4a6b7-44e5-4e52-8189-e5dee63797fe',
    
    // Installments
    inst_1_amt: 'be077d9d-04a0-48e3-9bb8-6215a91d5b89',
    inst_1_date: '83225eac-ece6-4d40-9160-9338e60a35d6',
    inst_2_amt: '0be8fd5b-671d-4b96-83df-380dc52734df',
    inst_2_date: '3c1078df-56d0-4664-9a02-929a7736f55e',
    inst_3_amt: '67d9c792-ad16-445e-b3fe-a60ab86f4b11',
    inst_3_date: '8ee4259a-11c2-4b59-84f1-beacf40c7e12',
    inst_4_amt: 'ddc9ad23-7474-472f-901f-31c6b7aa0881',
    inst_4_date: '35e8cd1f-c620-47cc-994c-2caf43434500',

    // Visa List Specific
    visa_code: 'a907808c-1625-4f56-acfe-cb1732e13ae6'
  }
};

// Helper to post to ClickUp
const postToClickUp = async (listId: string, payload: any) => {
  try {
    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: 'POST',
      headers: {
        'Authorization': CLICKUP_CONFIG.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ClickUp API Error:', errorData);
      return false;
    }
    const data = await response.json();
    console.log('ClickUp Success:', data);
    return true;
  } catch (error) {
    console.error('ClickUp Network Error:', error);
    return false;
  }
};

// Helper to format date to Unix timestamp (milliseconds)
const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  return new Date(dateString).getTime();
};

export const syncProfileToClickUp = async (app: Applicant, countries: Country[]) => {
  const country = countries.find(c => c.id === app.countryId);
  const f = CLICKUP_CONFIG.fields;

  // Map Installments (Safety check for array length)
  const i1 = app.installments[0]; // Usually Entry
  const i2 = app.installments[1];
  const i3 = app.installments[2];
  const i4 = app.installments[3];

  const customFields = [
    { id: f.customer_id, value: app.id },
    { id: f.surname, value: app.surname },
    { id: f.phone, value: app.mobile },
    { id: f.alt_phone, value: app.alternativeMobile || '' },
    { id: f.email, value: app.email },
    { id: f.password, value: app.password },
    { id: f.role, value: 'CUSTOMER' },
    
    // Application Details
    { id: f.apply_country, value: country?.name || '' },
    { id: f.visa_name, value: app.visaName },
    { id: f.nationality, value: app.nationality },
    { id: f.job_title, value: app.profession },
    { id: f.application_date, value: formatDate(app.applicationDate) },
    
    // Financials
    { id: f.cost, value: app.financeData.basePrice }, // Base cost
    { id: f.reg_fee, value: app.financeData.regFee },
    { id: f.vat, value: country?.vat || 0 },
    { id: f.discount_name, value: app.selectedDiscountType },
    { id: f.grand_total, value: app.financeData.totalAmount }, // Brand Total

    // Installments
    ...(i1 ? [{ id: f.inst_1_amt, value: i1.amount }, { id: f.inst_1_date, value: formatDate(i1.dueDate) }] : []),
    ...(i2 ? [{ id: f.inst_2_amt, value: i2.amount }, { id: f.inst_2_date, value: formatDate(i2.dueDate) }] : []),
    ...(i3 ? [{ id: f.inst_3_amt, value: i3.amount }, { id: f.inst_3_date, value: formatDate(i3.dueDate) }] : []),
    ...(i4 ? [{ id: f.inst_4_amt, value: i4.amount }, { id: f.inst_4_date, value: formatDate(i4.dueDate) }] : []),
  ];

  const payload = {
    name: app.name, // Task Name = First Name (as per common practice if surname is separate)
    description: `New Applicant Profile created via Admin Panel. \nPlan: ${app.paymentMode}`,
    custom_fields: customFields
  };

  return await postToClickUp(CLICKUP_CONFIG.lists.profileCreation, payload);
};

export const syncUserToClickUp = async (user: Staff) => {
  const f = CLICKUP_CONFIG.fields;

  const customFields = [
    { id: f.customer_id, value: user.id },
    { id: f.email, value: user.email },
    { id: f.password, value: user.password },
    { id: f.role, value: user.role },
    { id: f.designation, value: user.designation }
  ];

  const payload = {
    name: user.name,
    description: `Staff Member - Status: ${user.status}`,
    custom_fields: customFields
  };

  return await postToClickUp(CLICKUP_CONFIG.lists.user, payload);
};

export const syncCountryToClickUp = async (country: Country) => {
  const f = CLICKUP_CONFIG.fields;

  const customFields = [
    { id: f.visa_code, value: country.id },
    { id: f.visa_name, value: country.visaType },
    { id: f.cost, value: country.basePrice },
    { id: f.reg_fee, value: country.regFee }
  ];

  const payload = {
    name: country.name, // Task Name = Country Name
    description: `Visa Configuration for ${country.name}. VAT: ${country.vat}%`,
    custom_fields: customFields
  };

  return await postToClickUp(CLICKUP_CONFIG.lists.visa, payload);
};
