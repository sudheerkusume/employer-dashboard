const employeesData = [
    // Existing Profile Example
    {
        id: 1,
        name: "Noah Davis",
        location: "Mumbai",
        image: "https://randomuser.me/api/portraits/women/93.jpg",
        category: "Channel Partners",
        title: "Channel Partners - Mumbai",
        email: "noah.davis@example.com",
        summary: "Experienced Channel Partners with proven track record in channel partners and related projects.",
        ratings: 3.5,
        education: [
            {
                degree: "MBA in Marketing",
                board: "IIM Bangalore",
                years: "1 - 5"
            },
            {
                degree: "BBA",
                board: "Delhi University",
                years: "7 - 1"
            }
        ],
        experience: [
            {
                company: "SalesForce",
                location: "Mumbai",
                role: "Channel Partners",
                startDate: "4-07",
                endDate: "5-05",
                description: "Worked at SalesForce as Channel Partners contributing to projects and growth."
            },
            {
                company: "HubSpot",
                location: "Mumbai",
                role: "Channel Partners",
                startDate: "1-01",
                endDate: "6-08",
                description: "Worked at HubSpot as Channel Partners contributing to projects and growth."
            },
            {
                company: "Zoho",
                location: "Mumbai",
                role: "Channel Partners",
                startDate: "0-06",
                endDate: "0-08",
                description: "Worked at Zoho as Channel Partners contributing to projects and growth."
            }
        ]
    },

    // Bheema
    {
        id: 2,
        name: "Bheema Guguloth",
        email: "bheema.realbeez.com",
        role: "employee",
        password: "bheema@123",
        attendance: [
            {
                title: "Present (9hrs)",
                start: new Date(2025, 9, 1),
                end: new Date(2025, 9, 1),
                type: "present",
                status: "approved",
                checkIn: "09:00 AM",
                checkOut: "06:00 PM",
                workingHours: 9
            },
            {
                title: "Holiday",
                start: new Date(2025, 9, 10),
                end: new Date(2025, 9, 12),
                type: "holiday"
            }
        ],
        experience: [],
        education: []
    },

    // 5 Members with same attendance, empty experience & education
    {
        id: 3,
        name: "Vikranth",
        role: "manager",
        password: "bheema@123",
        email: "vikranth.realbeez.com",
        attendance: [
            {
                title: "Present (9hrs)",
                start: new Date(2025, 9, 1),
                end: new Date(2025, 9, 1),
                type: "present",
                status: "approved",
                checkIn: "09:00 AM",
                checkOut: "06:00 PM",
                workingHours: 9
            },
            {
                title: "Holiday",
                start: new Date(2025, 9, 10),
                end: new Date(2025, 9, 12),
                type: "holiday"
            }
        ],
        experience: [],
        education: []
    },
    {
        id: 4,
        name: "Vinod Kumar",
        role: "employee",
        email: "vinodkumar.realbeez.com",
        attendance: [
            {
                title: "Present (9hrs)",
                start: new Date(2025, 9, 1),
                end: new Date(2025, 9, 1),
                type: "present",
                status: "approved",
                checkIn: "09:00 AM",
                checkOut: "06:00 PM",
                workingHours: 9
            },
            {
                title: "Holiday",
                start: new Date(2025, 9, 10),
                end: new Date(2025, 9, 12),
                type: "holiday"
            }
        ],
        experience: [],
        education: []
    },
    {
        id: 5,
        name: "Bhargavi",
        role: "employee",
        email: "bhargavi.realbeez.com",
        attendance: [
            {
                title: "Present (9hrs)",
                start: new Date(2025, 9, 1),
                end: new Date(2025, 9, 1),
                type: "present",
                status: "approved",
                checkIn: "09:00 AM",
                checkOut: "06:00 PM",
                workingHours: 9
            },
            {
                title: "Holiday",
                start: new Date(2025, 9, 10),
                end: new Date(2025, 9, 12),
                type: "holiday"
            }
        ],
        experience: [],
        education: []
    },
    {
        id: 6,
        name: "Mohan",
        role: "employee",
        email: "mohan.realbeez.com",
        attendance: [
            {
                title: "Present (9hrs)",
                start: new Date(2025, 9, 1),
                end: new Date(2025, 9, 1),
                type: "present",
                status: "approved",
                checkIn: "09:00 AM",
                checkOut: "06:00 PM",
                workingHours: 9
            },
            {
                title: "Holiday",
                start: new Date(2025, 9, 10),
                end: new Date(2025, 9, 12),
                type: "holiday"
            }
        ],
        experience: [],
        education: []
    },
    {
        id: 7,
        name: "Sunil",
        role: "employee",
        email: "sunil.realbeez.com",
        attendance: [
            {
                title: "Present (9hrs)",
                start: new Date(2025, 9, 1),
                end: new Date(2025, 9, 1),
                type: "present",
                status: "approved",
                checkIn: "09:00 AM",
                checkOut: "06:00 PM",
                workingHours: 9
            },
            {
                title: "Holiday",
                start: new Date(2025, 9, 10),
                end: new Date(2025, 9, 12),
                type: "holiday"
            }
        ],
        experience: [],
        education: []
    },
    {
        id: 8,
        name: "Parvalika",
        role: "hr",
        password: "bheema@123",
        email: "parvalika.realbeez.com",
        attendance: [
            {
                title: "Present (9hrs)",
                start: new Date(2025, 9, 1),
                end: new Date(2025, 9, 1),
                type: "present",
                status: "approved",
                checkIn: "09:00 AM",
                checkOut: "06:00 PM",
                workingHours: 9
            },
            {
                title: "Holiday",
                start: new Date(2025, 9, 10),
                end: new Date(2025, 9, 12),
                type: "holiday"
            }
        ],
        experience: [],
        education: []
    }
];
