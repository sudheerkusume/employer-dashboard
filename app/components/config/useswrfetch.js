import useSWR, { useSWRConfig } from "swr";
import { getServiceHeader } from "./sitesettings";

const fetcher = async (url) => {
    try {
        const res = await fetch(url, { headers: await getServiceHeader() });
        if (res.ok) {
            if (res.status === 200) {
                return res.json();
            } else if (res.status === 401) {
                console.log("Unauthorized access");
                return;
            } else {
                let error = true
                console.log(error);
                throw error;
            }
        } else {
            return []
        }
    } catch (error) {
        if (error.message !== "Unauthorized access") {
            console.log(true);
        }
        throw error;
    }
};
export function useSWRFetch(url) {
    const { data, error, isLoading } = useSWR(url && url, fetcher, { revalidateOnFocus: false, shouldRetryOnError: false });
    return {
        data: data,
        error: error,
        isLoading: isLoading
    }
}

export function Mutated(url) {
    const { mutate } = useSWRConfig();
    const mutated = () => { mutate(url) };
    return mutated;
}