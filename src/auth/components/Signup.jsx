import React from 'react'
import InputField from '../../components/InputField'

const Signup = ({ setIsSignup, formState, setFormState, handleSubmit, pending, errors, setErrors,handleGoogleSignIn }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;

        // no any feilds should be more that 8 letters except email
        if(name !== 'email' && value.length > 8){
            return;
        }

        setFormState((prev) => ({ ...prev, [name]: value }));
        setErrors('')
    };

    const handleAuthPage = () => {
        setIsSignup(false)
        setErrors('')
    }

    return (
        <div className="flex-1 bg-white flex flex-col justify-center p-8 sm:px-12 md:px-16 lg:px-24">
            <div className="text-right">
                <span className="text-gray-600">Already have an account?</span>{" "}
                <span className="text-blue-500 font-semibold cursor-pointer" onClick={handleAuthPage}>
                    Login
                </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mt-8">Get started.</h2>
            <p className="text-gray-500 mb-6">Sign up to the platform</p>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <button className="flex-1 bg-gray-100 py-2 rounded-md shadow-md text-sm font-semibold" onClick={handleGoogleSignIn}>
                    <span>📧</span> Sign up with Google
                </button>
             
            </div>

            <div className="text-center text-gray-400 text-sm mb-6">or</div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-4 mb-2">
                    <InputField
                        type='text'
                        name='firstName'
                        placeholder="FirstName"
                        onChange={handleChange}
                        value={formState?.firstName}
                    />
                    <InputField
                        type='text'
                        name='lastName'
                        placeholder="LastName"
                        onChange={handleChange}
                        value={formState?.lastName}
                    />
                    <InputField
                        type='email'
                        name='email'
                        placeholder="Email"
                        onChange={handleChange}
                        value={formState?.email}
                    />
                    <InputField
                        type='password'
                        name='password'
                        placeholder="Password"
                        onChange={handleChange}
                        value={formState?.password}
                    />
                </div>
                <span className='text-red-500 text-sm font-semibold'>{errors}</span>
                {/* <div className="flex items-center mt-2">
                    <input
                        type="checkbox"
                        id="terms"
                        className="mr-2 w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-500">
                        I agree to the platform's{" "}
                        <a href="#terms" className="text-blue-500">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#privacy" className="text-blue-500">
                            Privacy Policy
                        </a>
                    </label>
                </div> */}
                <button
                    type="submit"
                    className="w-full bg-blue-500 disabled:bg-gray-400 disabled:cursor-wait text-white py-3 rounded-md mt-6 shadow-md hover:bg-blue-600"
                    disabled={pending}
                >
                    Sign Up
                </button>
            </form>
        </div>
    )
}

export default Signup