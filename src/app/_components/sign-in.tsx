import { SignIn } from "@clerk/nextjs";

export function LoginForm() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Left Section - Company Info */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 text-white flex-col justify-center items-center p-8">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-4">Bartu Chat</h1>
          <div className="mb-6">
            <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .55.45 1 1 1h.5c.25 0 .5-.1.7-.29L13.9 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H13.2l-3.8 3.4V16H4V4h16v12z" />
              <path d="M8 9h8v2H8zm0-3h8v2H8zm0 6h5v2H8z" />
            </svg>
            <p className="text-xl font-medium">Super easy and fast self hosted or API access to your favorite LLMs</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-full mr-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <p>Self-hosted deployment in minutes</p>
            </div>
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-full mr-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <p>Simple API integration</p>
            </div>
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-full mr-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <p>Support for all popular LLM models</p>
            </div>
          </div>
        </div>
      </div>
      {/* Right Section - Login Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 md:hidden">
            <h1 className="text-3xl font-bold text-blue-600">Bartu Chat</h1>
            <p className="text-gray-600 mt-2">Access your favorite LLMs</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <SignIn routing="hash" />
          </div>
        </div>
      </div>
    </div>
  );
}