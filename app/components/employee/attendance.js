"use client";
import React, { useState, useEffect, useContext } from "react";
import moment from "moment";
import CalendarTab from "./calendar";
import Loading from "../common/loading";
import RootContext from "../config/rootcontext";

// TODO: Update these coordinates with your actual office GPS location
const OFFICE_COORDINATES = {
    latitude: 17.446833, // 17°26'48.6"N
    longitude: 78.378944 // 78°22'44.2"E
};
const ALLOWED_RADIUS_METERS = 200;

// Haversine formula to calculate distance between two GPS coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const toRadians = (deg) => deg * (Math.PI / 180);
    const p1 = toRadians(lat1);
    const p2 = toRadians(lat2);
    const dp = toRadians(lat2 - lat1);
    const dl = toRadians(lon2 - lon1);

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

export default function Attendance({ profile }) {
    const user_details =
        typeof window !== "undefined" &&
        JSON.parse(localStorage.getItem("user_details"));
    const employeeId = user_details?.userId;

    const [todayAttendance, setTodayAttendance] = useState({
        checkIn: "",
        checkOut: "",
        date: new Date(),
        checkInTime: null,
    });
    const [canCheckOut, setCanCheckOut] = useState(false);
    const [serviceCall, setServiceCall] = useState(false);
    const todayStr = new Date().toISOString().split("T")[0];
    const { setRootContext } = useContext(RootContext);
    // ✅ Fetch today's attendance from profile on mount
    useEffect(() => {
        if (!profile || !profile.attendance) return;

        const monthName = new Date(todayStr).toLocaleString("default", {
            month: "long",
        });
        const monthAttendance = profile.attendance[monthName] || [];
        const todayAtt = monthAttendance.find((a) => a.date === todayStr);

        if (todayAtt) {
            setTodayAttendance({
                checkIn: todayAtt.checkIn || "",
                checkOut: todayAtt.checkOut || "",
                date: new Date(todayStr),
                checkInTime: todayAtt.checkIn
                    ? moment(todayAtt.date + "T" + todayAtt.checkIn)
                    : null,
            });

            // If already checked in and enough time passed
            if (todayAtt.checkIn && !todayAtt.checkOut) {
                const diffHours = moment().diff(
                    moment(todayAtt.date + "T" + todayAtt.checkIn),
                    "hours",
                    true
                );
                setCanCheckOut(diffHours >= 4.5);
            }
        }
    }, [profile]);

    // ✅ Auto-enable checkout after 4.5 hours
    useEffect(() => {
        let interval;
        if (todayAttendance.checkInTime && !todayAttendance.checkOut) {
            interval = setInterval(() => {
                const now = moment();
                const checkIn = moment(todayAttendance.checkInTime);
                const worked = now.diff(checkIn, "hours", true);
                setCanCheckOut(worked >= 4.5);
            }, 60000); // check every 1 min
        }
        return () => clearInterval(interval);
    }, [todayAttendance.checkInTime, todayAttendance.checkOut]);

    // ✅ Check-In Handler
    const handleCheckIn = async () => {
        if (!navigator.geolocation) {
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: { show: true, dismiss: true, type: "error", title: "Error", message: "Geolocation is not supported by your browser." }
            }));
            return;
        }

        setServiceCall(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const distance = calculateDistance(latitude, longitude, OFFICE_COORDINATES.latitude, OFFICE_COORDINATES.longitude);
                
                if (distance > ALLOWED_RADIUS_METERS) {
                    setServiceCall(false);
                    setRootContext((prevContext) => ({
                        ...prevContext,
                        toast: { show: true, dismiss: true, type: "error", title: "Location Error", message: `You are ${Math.round(distance)}m away from the office. Check-in allowed within ${ALLOWED_RADIUS_METERS}m.` }
                    }));
                    return;
                }

                try {
                    const now = new Date();
                    const res = await fetch("/api/attendance", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            employeeId,
                            action: "checkin",
                            time: now
                                .toLocaleTimeString("en-GB", { hour12: false })
                                .slice(0, 5),
                            date: todayStr,
                        }),
                    });

                    const data = await res.json().catch(() => ({}));
                    if (res.status) {
                        setServiceCall(false)
                    }
                    if (res.ok) {
                        setTodayAttendance({
                            checkIn: data.attendance.checkIn,
                            checkOut: "",
                            date: new Date(todayStr),
                            checkInTime: moment(),
                        });
                        setCanCheckOut(false);
                        setRootContext((prevContext) => ({
                            ...prevContext,
                            toast: {
                                show: true,
                                dismiss: true,
                                type: "success",
                                title: `success`,
                                message: `At ${now} Check-in Success`,
                            },
                        }));
                    } else {
                        setRootContext((prevContext) => ({
                            ...prevContext,
                            toast: {
                                show: true,
                                dismiss: true,
                                type: "error",
                                title: `Failed`,
                                message: `${data?.message || data?.error}` || "Check-in failed",
                            },
                        }));
                    }
                } catch (err) {
                    console.log(err);
                    setRootContext((prevContext) => ({
                        ...prevContext,
                        toast: {
                            show: true,
                            dismiss: true,
                            type: "error",
                            title: `Failed`,
                            message: `Failed to check in` || "Check-in failed",
                        },
                    }));
                }
            },
            (error) => {
                setServiceCall(false);
                let message = "Unable to get your location.";
                if (error.code === 1) message = "Please allow location access to check in.";
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: { show: true, dismiss: true, type: "error", title: "Location Error", message }
                }));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // ✅ Check-Out Handler
    const handleCheckOut = async () => {
        if (!navigator.geolocation) {
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: { show: true, dismiss: true, type: "error", title: "Error", message: "Geolocation is not supported by your browser." }
            }));
            return;
        }

        if (!todayAttendance.checkIn) {
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "warning",
                    title: `Warning`,
                    message: "Please check in first!",
                },
            }));
            return;
        }

        setServiceCall(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const distance = calculateDistance(latitude, longitude, OFFICE_COORDINATES.latitude, OFFICE_COORDINATES.longitude);
                
                if (distance > ALLOWED_RADIUS_METERS) {
                    setServiceCall(false);
                    setRootContext((prevContext) => ({
                        ...prevContext,
                        toast: { show: true, dismiss: true, type: "error", title: "Location Error", message: `You are ${Math.round(distance)}m away from the office. Check-out allowed within ${ALLOWED_RADIUS_METERS}m.` }
                    }));
                    return;
                }

                try {
                    const now = new Date();
                    const res = await fetch("/api/attendance", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            employeeId,
                            action: "checkout",
                            time: now
                                .toLocaleTimeString("en-GB", { hour12: false })
                                .slice(0, 5),
                            date: todayStr,
                        }),
                    });
                    if (res.status) {
                        setServiceCall(false)
                    }
                    const data = await res.json().catch(() => ({}));
                    if (res.ok) {
                        setRootContext((prevContext) => ({
                            ...prevContext,
                            toast: {
                                show: true,
                                dismiss: true,
                                type: "success",
                                title: `success`,
                                message: `Checked out successfully.\nWorking Hours: ${data.attendance.workingHours} hrs\nStatus: ${data.attendance.status}`,
                            },
                        }));

                        setTodayAttendance({
                            checkIn: "",
                            checkOut: data.attendance.checkOut,
                            date: new Date(todayStr),
                            checkInTime: null,
                        });
                        setCanCheckOut(false);
                    } else {
                        console.log(data?.message || data?.error || "Check-out failed");
                        setRootContext((prevContext) => ({
                            ...prevContext,
                            toast: {
                                show: true,
                                dismiss: true,
                                type: "error",
                                title: `Failed`,
                                message: `${data?.message || data?.error}` || "Check-out failed",
                            },
                        }));
                    }
                } catch (err) {
                    console.log(err);
                    setRootContext((prevContext) => ({
                        ...prevContext,
                        toast: {
                            show: true,
                            dismiss: true,
                            type: "error",
                            title: `Failed`,
                            message: `Failed to check Out` || "Check-Out failed",
                        },
                    }));
                }
            },
            (error) => {
                setServiceCall(false);
                let message = "Unable to get your location.";
                if (error.code === 1) message = "Please allow location access to check out.";
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: { show: true, dismiss: true, type: "error", title: "Location Error", message }
                }));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // ✅ Check if already checked in
    const isCheckedIn =
        !!todayAttendance.checkIn && !todayAttendance.checkOut;

    // ✅ UI
    return (
        <div className="min-h-screen bg-gray-100 sm:p-6 space-y-6">
            {serviceCall && <Loading />}
            <CalendarTab
                profile={profile}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                isCheckedIn={isCheckedIn}
            />
        </div>
    );
}