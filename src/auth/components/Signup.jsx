import React from "react";
import InputField from "../../components/InputField";

const Signup = ({
  setIsSignup,
  formState,
  loading,
  setFormState,
  handleSubmit,
  pending,
  errors,
  setErrors,
  handleGoogleSignIn,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;

    // no any feilds should be more that 8 letters except email
    if (name !== "email" && value.length > 8) {
      return;
    }

    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors("");
  };

  const handleAuthPage = () => {
    setIsSignup(false);
    setErrors("");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold">Get started.</h2>
        <p className="text-gray-500 mb-6">Sign up to the platform</p>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="space-y-4 mb-2">
            <InputField
              type="text"
              name="firstName"
              placeholder="First Name"
              onChange={handleChange}
              value={formState?.firstName}
            />
            <InputField
              type="text"
              name="lastName"
              placeholder="Last Name"
              onChange={handleChange}
              value={formState?.lastName}
            />
            <InputField
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              value={formState?.email}
            />
            <InputField
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              value={formState?.password}
            />
          </div>

          {errors && (
            <span className="text-red-500 text-sm font-semibold block mb-2">
              {errors}
            </span>
          )}

          <button
            type="submit"
            className="w-full flex justify-center items-center bg-blue-500 disabled:bg-gray-400 disabled:cursor-wait text-white py-3 rounded-md shadow-md hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
            ) : (
              "Sign Up"
            )}
          </button>

          <div className="text-center mt-1">
            <span className="text-gray-600 text-sm">Already have an account?</span>{" "}
            <button
              type="button"
              className="text-blue-500 font-semibold hover:text-blue-600 transition-colors text-sm"
              onClick={handleAuthPage}
            >
              Login
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-x-2 bg-gray-100 hover:bg-gray-200 transition-colors py-3 rounded-md shadow-md text-sm font-semibold"
            onClick={handleGoogleSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 48 48"
              className="shrink-0"
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.325C33.74 32.974 29.235 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.066 0 5.86 1.153 7.982 3.041l5.657-5.657C33.912 6.461 29.221 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 19.899-8.955 19.899-20 0-1.34-.138-2.651-.388-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.389 16.067 18.882 12 24 12c3.066 0 5.86 1.153 7.982 3.041l5.657-5.657C33.912 6.461 29.221 4 24 4 16.318 4 9.654 8.852 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.159 0 9.946-1.975 13.572-5.189l-6.274-5.293C29.14 35.652 26.673 36 24 36c-5.206 0-9.729-3.014-11.908-7.365l-6.504 5.01C9.632 39.146 16.357 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.325c-1.39 3.637-4.616 6.145-8.325 6.145-2.374 0-4.534-.845-6.197-2.252l-6.504 5.01C17.198 40.23 20.403 42 24 42c5.438 0 10.181-3.275 12.318-7.883l5.89 4.96C40.536 39.367 32.643 44 24 44c-7.643 0-14.368-4.854-17.404-11.856l-6.504 5.01C5.633 39.145 14.69 44 24 44c11.045 0 19.899-8.955 19.899-20 0-1.34-.138-2.651-.388-3.917z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
