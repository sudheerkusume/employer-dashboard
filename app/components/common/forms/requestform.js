'use client'
import React, { useState } from 'react';
const PersonalInformation = ({ formData, handleChange }) => (
    // The blue-bordered section for personal info
    <div className="border border-blue-400 p-4 rounded-lg mt-4 bg-white/70 text-gray-600 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">PERSONAL INFORMATION</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
                type="text"
                name="name"
                placeholder="Enter Your Name"
                className="p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                value={formData.name || ''}
                onChange={handleChange}
            />
            <input
                type="text"
                name="mobile"
                placeholder="Mobile Number"
                className="p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                value={formData.mobile || ''}
                onChange={handleChange}
            />
            <input
                type="text"
                name="occupation"
                placeholder="Occupation"
                className="p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                value={formData.occupation || ''}
                onChange={handleChange}
            />
            <input
                type="text"
                name="aadhar"
                placeholder="Aadhar Card"
                className="p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                value={formData.aadhar || ''}
                onChange={handleChange}
            />
            <input
                type="text"
                name="pan"
                placeholder="PAN Card - Optional"
                className="p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                value={formData.pan || ''}
                onChange={handleChange}
            />
        </div>
    </div>
);

// Generic Button Group for Property Requirements (e.g., 1BHK, East, New)
const ButtonGroup = ({ title, options, isRadio, selected, handleSelect, groupName }) => (
    <div className="flex items-center space-x-4 mb-3">
        {/* The dark button on the left (e.g., "FACING DIRECTION") */}
        <div className="w-48">
            <button className="w-full bg-gray-700 text-white p-2 rounded-l font-medium text-sm">
                {title}
            </button>
        </div>
        {/* The selectable options on the right */}
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => handleSelect(groupName, option, isRadio)}
                    // Conditional styling for selected state (amber background for active)
                    className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${Array.isArray(selected) ? (selected.includes(option) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100') :
                        (selected === option ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100')
                        }`}
                >
                    {option}
                </button>
            ))}
            {title === 'PROJECT AMENITIES' && (
                <button className="text-amber-500 font-bold text-sm ml-2">
                    + VIEW MORE
                </button>
            )}
        </div>
    </div>
);

// Main Component
const RequestForm = () => {
    const [formData, setFormData] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelect = (groupName, value, isRadio = false) => {
        // Logic for handling both single-select (radio-like) and multi-select (checkbox-like)
        setFormData((prev) => {
            const current = prev[groupName] || (isRadio ? null : []);

            if (isRadio) {
                // Radio-like behavior: select the new value
                return { ...prev, [groupName]: value };
            } else {
                // Checkbox-like behavior: toggle the value in an array
                const newArray = current.includes(value)
                    ? current.filter((v) => v !== value)
                    : [...current, value];
                return { ...prev, [groupName]: newArray };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    // --- Data for the Property Requirements Section ---
    const propertyTypes = ['APARTMENT', 'VILLA', 'OPEN PLOTS', 'FARMLANDS', 'COMMERCIAL', 'GO DOWNS', 'LEGAL'];
    const locations = ['HYDERABAD', 'DELHI' ];
    const directions = ['EAST', 'WEST', 'NORTH', 'SOUTH'];
    const areaTypes = ['SQ. FT.', 'SQ. YARDS'];
    const configurations = ['1 BHK', '2 BHK', '3 BHK', '4 BHK'];
    const amenities = ['PARKING', 'OPEN GYM', 'LIFT / ELEVATOR', 'BANQUET HALL'];
    const ageOfProperty = ['NEW', '5+ YEARS', '10+ YEARS'];
    const nearbyPlaces = ['SCHOOLS', 'HOSPITALS', 'IT PARKS', 'METRO'];
    const paymentPlan = ['EMI', 'LOAN', 'INSTALLMENT', 'FULL'];
    const furnishingStatus = ['FULLY FURNISHED', 'SEMI FURNISHED', 'UNFURNISHED'];


    return (
        <div className='bg-white w-full'>
            <div className="max-w-4xl mx-auto p-4 border-4 rounded-lg border-amber-700 bg-amber-50">
                <div className='flex justify-end'>
                    <button className="text-gray-500 hover:text-gray-900 text-2xl">
                        &times;
                    </button>
                </div>

                <div className="mb-6">
                    {/* Placeholder for the illustration (Use an actual image or Tailwind for a similar look) */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-lg h-34 flex items-end justify-center">
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://picsum.photos/800/200?blur=1')" }}>
                            {/*  - use this tag for a better illustration */}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Personal Information Section */}
                    <PersonalInformation formData={formData} handleChange={handleChange} />

                    <hr className="my-8 border-amber-300" />

                    {/* Property Requirements Section */}
                    <div className="p-4 bg-white/80 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">PROPERTY REQUIREMENTS</h3>

                        {/* Property Type (Checkbox-like behavior) */}
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="w-48">
                                <button className="w-full bg-gray-700 text-white p-2 rounded-l font-medium text-sm h-full flex items-center justify-center">
                                    PROPERTY TYPE
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-4 pt-2">
                                {propertyTypes.map((type) => (
                                    <label key={type} className="flex items-center space-x-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={formData.propertyType?.includes(type) || false}
                                            onChange={() => handleSelect('propertyType', type, false)}
                                            className="form-checkbox text-amber-500 border-gray-300 rounded focus:ring-amber-500"
                                        />
                                        <span>{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Location Tags (Custom design) */}
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="w-48">
                                <button className="w-full bg-gray-700 text-white p-2 rounded-l font-medium text-sm">
                                    LOCATION
                                </button>
                            </div>
                            {/* Input field for search/text */}
                            <input
                                type="text"
                                placeholder="Enter Location or Select Tags..."
                                className="flex-grow p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                            />
                            {/* Example location tags */}
                            <div className='flex gap-2'>
                                {locations.map(loc => (
                                    <span key={loc} className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-semibold cursor-pointer">
                                        {loc} <span className='font-bold ml-1'>&times;</span>
                                    </span>
                                ))}
                            </div>
                        </div>


                        {/* The rest of the Button Groups (Radio-like behavior) */}
                        <ButtonGroup
                            title="FACING DIRECTION"
                            options={directions}
                            isRadio={true}
                            selected={formData.facingDirection}
                            handleSelect={handleSelect}
                            groupName="facingDirection"
                        />
                        <ButtonGroup
                            title="AREA TYPE"
                            options={areaTypes}
                            isRadio={true}
                            selected={formData.areaType}
                            handleSelect={handleSelect}
                            groupName="areaType"
                        />
                        <ButtonGroup
                            title="CONFIGURATIONS"
                            options={configurations}
                            isRadio={true}
                            selected={formData.configuration}
                            handleSelect={handleSelect}
                            groupName="configuration"
                        />

                        {/* Amenities (Checkbox-like behavior) */}
                        <ButtonGroup
                            title="PROJECT AMENITIES"
                            options={amenities}
                            isRadio={false}
                            selected={formData.amenities}
                            handleSelect={handleSelect}
                            groupName="amenities"
                        />
                        <ButtonGroup
                            title="AGE OF PROPERTY"
                            options={ageOfProperty}
                            isRadio={true}
                            selected={formData.ageOfProperty}
                            handleSelect={handleSelect}
                            groupName="ageOfProperty"
                        />
                        <ButtonGroup
                            title="NEARBY PLACES"
                            options={nearbyPlaces}
                            isRadio={false}
                            selected={formData.nearbyPlaces}
                            handleSelect={handleSelect}
                            groupName="nearbyPlaces"
                        />
                        <ButtonGroup
                            title="PAYMENT PLAN"
                            options={paymentPlan}
                            isRadio={true}
                            selected={formData.paymentPlan}
                            handleSelect={handleSelect}
                            groupName="paymentPlan"
                        />
                        <ButtonGroup
                            title="FURNISHING STATUS"
                            options={furnishingStatus}
                            isRadio={true}
                            selected={formData.furnishingStatus}
                            handleSelect={handleSelect}
                            groupName="furnishingStatus"
                        />

                    </div>

                    {/* Search Button */}
                    <div className="text-center mt-10">
                        <button
                            type="submit"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-12 rounded-lg shadow-xl transition-colors text-lg"
                        >
                            SEARCH PROPERTY
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestForm;