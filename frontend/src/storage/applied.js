const KEY = 'jobhub.appliedJobs';

const read = () => {
    try {
        return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
        return new Set();
    }
};

const write = (set) => {
    localStorage.setItem(KEY, JSON.stringify([...set]));
};

export const hasApplied = (jobId) => read().has(jobId);

export const markApplied = (jobId) => {
    const set = read();
    set.add(jobId);
    write(set);
};

export const unmarkApplied = (jobId) => {
    const set = read();
    set.delete(jobId);
    write(set);
};

export const clearApplied = () => {
    localStorage.removeItem(KEY);
};
