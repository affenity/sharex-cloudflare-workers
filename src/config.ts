type ProjectConfig = {
    // Do you want to require an auth key in order to be able to upload images?
    // Example header: x-auth-key: password
    requireAuthKey: boolean;
    // If so, what is the auth key?
    authKey?: string;
    // What domain is this worker attached to (don't have a / on the end)
    domain: string;
}

const config: ProjectConfig = {
    requireAuthKey: true,
    authKey: "lol",
    domain: "https://domain.com"
};

export default config;
