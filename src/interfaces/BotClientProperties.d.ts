export interface config {
    serviceName: string;
    logoBanner: string;
    colors: {
        neutral: string,
        positive: string,
        negative: string,
        muted: string,
        other: string
    };
    disclaimer: string;
    hints: string[];
}

export interface course {
    metadata: {
        subject: string,
        abbreviation: string,
        common: string[],
    };
    courses: {
        courseNumber: {
            name: string,
            credits: string,
            description: string,
            link: number | null,
            taughtWith: number | null,
        };
    };
}