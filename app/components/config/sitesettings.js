import dayjs from "dayjs";
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
export const ENV = process.env.NEXT_PUBLIC_ENV;
export const NODE_SERVICE_URL = process.env.NEXT_PUBLIC_NODE_SERVICE_URL;
export const svgimageUrl = "https://images.travelxp.com/images/txpin/vector";
export const imageUrl = "https://images.travelxp.com/images/txpin/vector/";
export const imageShopcartUrl = "https://images.travelxp.com/images/channels/";

export function URLregex() {
    const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
    return urlRegex;
}

export function numberValidate(value) {
    return value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
}

export function CharRegex() {
    const charRegex = /^[A-Za-z ]*$/;
    return charRegex;
}

export function gstregex() {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex;
}

export function emailregex() {
    const regex = /^[\w-.]+@[\w.]+/gm;
    return regex;
}

export function NoSpecialChar() {
    const noChar = /^[A-Za-z0-9 ]*$/;
    return noChar;
}

export function Numeric() {
    const numeric = /^[0-9.]*$/;
    return numeric;
}

export function Latitude() {
    const lat = /^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$/;
    return lat;
}

export function Longitude() {
    const long = /^-?((([1]?[0-7][0-9]|[1-9]?[0-9])\.{1}\d{1,6}$)|[1]?[1-8][0]\.{1}0{1,6}$)/;
    return long;
}

export function Pincode() {
    const pincode = /^[A-Za-z0-9]*$/;
    return pincode;
}

export function MobileNo() {
    const numeric = /^[0-9+]*$/;
    return numeric;
}

export function SSContactNo() {
    const contactno = /^([+]\d{2}[ ])?\d{10}$/;
    return contactno;
}

export function passportRegex() {
    const passportnumber = /^[A-Z][1-9]\d\s?\d{4}[1-9]$/;
    return passportnumber;
}

export function compTwoString(string1, string2) {
    const str1 = [...string1];
    const str2 = [...string2];
    const diff = str1
        .filter((x) => !str2.includes(x))
        .concat(str2.filter((x) => !str1.includes(x)))
        .toString();
    return diff;
}

export function compTwoArray(oldArr, newArr) {
    const diff = oldArr
        .filter((x) => !newArr.includes(x))
        .concat(newArr.filter((x) => !oldArr.includes(x)))
        .toString();
    return diff;
}

export const timeFormatHM = (time) => {
    const timeHM = time.split(":");
    return `${timeHM[0]}h ${timeHM[1]}m`;
};

export function calculateAspectRatioHeight(ratiowidth, ratio1, ratio2) {
    const ratio = ratiowidth / ratio1;
    const ratioheight = ratio * ratio2;
    return ratioheight;
}

export function convertSecondsToHoursAndMinutes(secs) {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.ceil(secs % 60);

    if (hours > 0) {
        return `${hours}h:${minutes} min`;
    }
    if (minutes > 0) {
        return `${minutes} min`;
    }
    return `${seconds} sec`;
}

export function amountFormatter(amount) {
    let val = Math.abs(amount);
    if (val >= 10000000) {
        val = `${(val / 10000000).toFixed(1)} Cr`;
    } else if (val >= 100000) {
        val = `${(val / 100000).toFixed(1)} Lac`;
    } else if (val >= 1000) {
        val = `${(val / 1000).toFixed(1)} K`;
    }
    return val;
}

export function titleCase(str) {
    if (typeof str !== 'string' || str.trim() === '') {
        return '';
    }

    return str.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
}

export async function getServiceHeader() {
    // const IsAuthenticate = await IsAuthenticated();
    const response = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    };
    return response;
}

export default function checkBrowser() {
    const agent = navigator.userAgent.toLowerCase();

    if (agent.includes("safari")) {
        if (agent.includes("opr") || agent.includes("whale") || agent.includes("chrome")) {
            return "Widevine";
        }
        if (agent.includes("edg/") || agent.includes("Edge/")) {
            return "PlayReady";
        }
        return "FairPlay"; // Safari
    }

    if (agent.includes("firefox")) {
        return "Widevine";
    }

    return "No DRM";
}

export function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export function convertDDMMYYYY(dateStr) {
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    const altDatePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (altDatePattern.test(dateStr)) {
        const parts = dateStr.split("-");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (datePattern.test(dateStr)) {
        return dateStr;
    }
    const date = formatDateTime(new Date(), "YYYY-MM-DD");
    const parts = date.split("-");
    return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


export const formatDateTime = (value, format, type) => {
    const date = type === "utc" ? dayjs.utc(convertDate(value)) : dayjs(convertDate(value));
    return date.format(format).toString();
};

export function fitScreenAsPerSize() {
    if (window.innerWidth == 1920) {
        //1920 * 1080
        document.body.style.zoom = "100%";
    }
    if (window.innerWidth <= 1440) {
        //1440 * 900
        document.body.style.zoom = "75%";
    }
    if (window.innerWidth <= 1280) {
        //1280 * 720
        document.body.style.zoom = "67%";
    }
}

export function convertDate(dateStr) {
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (datePattern.test(dateStr)) {
        const [day, month, year] = dateStr.split("-");
        return `${year}-${month}-${day}`;
    }
    return dateStr;
}

const updateRootContext = (setRootContext, type, title, message) => {
    setRootContext((prevContext) => ({
        ...prevContext,
        toast: {
            show: true,
            dismiss: true,
            type,
            title,
            message
        }
    }));
}

export function showNotification(setRootContext, res, mode) {
    if (res.status === 200) {
        updateRootContext(setRootContext, "success", "Status-Success", `${mode === "create" ? "New Item Added" : mode == "clear" ? "OTP Clear" : mode == "delete" ? "Item Deleted" : "Item Updated"} Successfully`);
    } else {
        res.text().then((errMsg) => {
            updateRootContext(setRootContext, "error", "Status-Fail", errMsg || "Something went wrong!");
        });
    }
}

