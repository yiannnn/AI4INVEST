'use client';
import React, { useEffect, useState, useRef} from 'react';

export default function EditFormPage() {
  const [step, setStep] = useState(2);
  const [formData, setFormData] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);
    const handleNextStep2 = () => {
      if (formRef.current?.reportValidity()) {
        setStep(3);
      }
    };

    const handleNextStep3 = () => {
      if (formRef.current?.reportValidity()) {
        setStep(4);
      }
    };
    const handleNextStep4 = () => {
      if (formRef.current?.reportValidity()) {
        setStep(5);
      }
    };
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('profileData') || '{}');
    if (saved) {
      setFormData(saved);
    }

  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formRef.current?.reportValidity()) {
        return; 
      }
    const username = localStorage.getItem("username");
  try {
    const predictResponse = await fetch("http://localhost:5050/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData),
    });

    if (!predictResponse.ok) throw new Error("Prediction failed");
    const predictData = await predictResponse.json();

    const updatedFormData = {
      username:username,
      profile:formData,
      risk_bucket: predictData.risk_bucket,
    };

    const response = await fetch("/api/submit/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFormData),
    });

    if (!response.ok) throw new Error("Update failed");

    localStorage.setItem("profileData", JSON.stringify(formData));
    localStorage.setItem("risk_bucket", predictData.risk_bucket);

    window.location.href = "/dashboard";
  } catch (error) {
    console.error(error);
    alert("Update failed");
  }
};


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-white p-6 border rounded-lg shadow-md text-black mt-16">
          <h2 className="text-xl font-semibold text-center mb-4">Edit Your Investment Profile</h2>

        <form ref={formRef}>
          {step === 2 && (
            <>
            <label className="block mb-2">Age Group</label>
            <select
                name="Age Group"
                value={formData["Age Group"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">18-24</option>
                <option value="2">25-34</option>
                <option value="3">35-44</option>
                <option value="4">45-54</option>
                <option value="5">55-64</option>
                <option value="6">65+</option>
            </select>
            <label className="block mb-2">Ethnicity</label>
            <select
                name="Ethnicity"
                value={formData["Ethnicity"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">White non-Hispanic</option>
                <option value="2">Non-White</option>
            </select>              
            <label className="block mb-2">Highest level of education completed</label>
            <select
                name="Education Level"
                value={formData["Education Level"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Did not complete High school</option>
                <option value="2">High school diploma</option>
                <option value="3">GED</option>
                <option value="4">Some college</option>
                <option value="5">Associate's degree</option>
                <option value="6">Bachelor's degree</option>
                <option value="7">Post graduate degree</option>
            </select>              
            <label className="block mb-2">Marital Status</label>
            <select
                name="Marital Status"
                value={formData["Marital Status"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Married</option>
                <option value="2">Single</option>
                <option value="3">Separated</option>
                <option value="4">Divorced</option>
                <option value="5">Widowed/widower</option>
                <option value="99">Prefer not to say</option>
            </select>   
            <label className="block mb-2">Number of financially dependent children</label>
            <select
                name="Financially dependent children"
                value={formData["Financially dependent children"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4 or more</option>
                <option value="5">No financially dependent children</option>
                <option value="6">Do not have any children</option>
                <option value="99">Prefer not to say</option>
            </select>  
            
            <button type="button"  onClick={handleNextStep2} className="w-full bg-gray-700 text-white py-2 rounded hover:bg-black">Next</button>

            </>
          )}
          {step === 3 && (
            <>
              <label className="block mb-2">Approximate annual household income</label>
            <select
                name="Annual Household Income"
                value={formData["Annual Household Income"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Less than $15,000</option>
                <option value="2">At least $15,000 but less than $25,000</option>
                <option value="3">At least $25,000 but less than $35,000</option>
                <option value="4">At least $35,000 but less than $50,000</option>
                <option value="5">At least $50,000 but less than $75,000</option>
                <option value="6">At least $75,000 but less than $100,000</option>
                <option value="7">At least $100,000 but less than $150,000</option>
                <option value="8">At least $150,000 but less than $200,000</option>
                <option value="9">At least $200,000 but less than $300,000</option>
                <option value="10">$300,000 or more</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>
            <label className="block mb-2">Over the past year, spending relative to income</label>
            <select
                name="spending_vs_income"
                value={formData.spending_vs_income}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Spending less than income</option>
                <option value="2">Spending more than income</option>
                <option value="3">Spending about equal to income</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>              
            <label className="block mb-2">In a typical month, how difficult to cover expenses/pay bills</label>
            <select
                name="difficulty_covering_expenses"
                value={formData.difficulty_covering_expenses}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Very difficult</option>
                <option value="2">Somewhat difficult</option>
                <option value="3">Not at all difficult</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>              
            <label className="block mb-2">Have set aside emergency funds to cover 3 months’ expenses</label>
            <select
                name="Emergency fund to cover 3 Months expenses"
                value={formData["Emergency fund to cover 3 Months expenses"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Yes</option>
                <option value="2">No</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>   
            <label className="block mb-2">Willingness to take financial risks when investing</label>
            <select
                name="risk_tolerance"
                value={formData.risk_tolerance}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">1 - Not At All Willing</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10 - Extremely Willing</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>
              <button type="button"  onClick={handleNextStep3} className="w-full bg-gray-700 text-white py-2 rounded hover:bg-black">Next</button>
            </>
          )}  
         
          {step === 4 && (
            <>
              <label className="block mb-2">Do you have a checking account?</label>
            <select
                name="Account ownership check"
                value={formData["Account ownership check"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Yes</option>
                <option value="2">No</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>
            <label className="block mb-2">Do you have a savings account, money market account, or CDs?</label>
            <select
                name="Savings/Money market/CD account ownership"
                value={formData["Savings/Money market/CD account ownership"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Yes</option>
                <option value="2">No</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>              
            <label className="block mb-2">Have any employer-sponsored retirement plan (401(k), pension, etc.)?</label>
            <select
                name="Employer-sponsored retirement plan ownership"
                value={formData["Employer-sponsored retirement plan ownership"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Yes</option>
                <option value="2">No</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>   
            <label className="block mb-2">Do you regularly contribute to a retirement account (401(k), IRA, etc.)?</label>
            <select
                name="Regular contribution to a retirement account"
                value={formData["Regular contribution to a retirement account"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Yes</option>
                <option value="2">No</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>  
            <label className="block mb-2">Not including retirement accounts, do you have investments in stocks/bonds/mutual funds?</label>
            <select
                name="Non-retirement investments in stocks, bonds, mutual funds"
                value={formData["Non-retirement investments in stocks, bonds, mutual funds"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Yes</option>
                <option value="2">No</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>             
            <label className="block mb-2">Do you [or your spouse/partner] currently own your home?</label>
            <select
                name="Homeownership"
                value={formData["Homeownership"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Yes</option>
                <option value="2">No</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>   
              <button type="button"  onClick={handleNextStep4} className="w-full bg-gray-700 text-white py-2 rounded hover:bg-black">Next</button>
            </>
          )}  

          {step === 5 && (
            <>
              <label className="block mb-2">Satisfaction with current personal financial condition</label>
            <select
                name="Current financial condition satisfaction"
                value={formData["Current financial condition satisfaction"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">1 - Not At All Satisfied</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10 - Extremely Satisfied</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>
            <label className="block mb-2">Frequency of thinking about personal financial condition</label>
            <select
                name="Thinking about FC frequency"
                value={formData["Thinking about FC frequency"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">Never</option>
                <option value="2">Less than once a month</option>
                <option value="3">About once a month</option>
                <option value="4">About once a week</option>
                <option value="5">About once a day</option>
                <option value="6">More than once a day</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>              
            <label className="block mb-2">“I am good at dealing with day-to-day financial matters”</label>
            <select
                name="Self-efficacy"
                value={formData["Self-efficacy"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">1 - Strongly Disagree</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4 - Neither Agree nor Disagree</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7 - Strongly Agree</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>              
            <label className="block mb-2">On a scale from 1 to 7, where 1 means very low and 7 means very high, how would you assess your overall financial knowledge?</label>
            <select
                name="Self-rated overall financial knowledge"
                value={formData["Self-rated overall financial knowledge"]}
                onChange={handleChange}
                className="w-full mb-4 p-2 border rounded"
                required
                >
                <option value="">-- Please select an option --</option>
                <option value="1">1 - Very Low</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7 - Very High</option>
                <option value="98">Don't know</option>
                <option value="99">Prefer not to say</option>
            </select>   
            <button type="button"  onClick={handleSubmit}className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                Submit
            </button>
              </>
          )}  
          </form>
        </div>
      </div>
    </div>
  );
}
