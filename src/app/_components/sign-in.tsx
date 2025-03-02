import { SignIn } from "@clerk/nextjs";

export function CustomSignIn() {
    return (
        <div className="flex justify-center items-center h-screen">
            <SignIn routing="hash" />
        </div>
    );
}