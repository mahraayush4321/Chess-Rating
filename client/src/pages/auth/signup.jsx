import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SignupPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authService.signup(formData);

      if (response.ok) {
        const data = await response.json();
        login(data.user); // Use auth context login
        navigate('/home');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <Card className="w-full max-w-md border-none bg-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter your details to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-400 text-center">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">First Name</label>
                <Input
                  type="text"
                  placeholder="John"
                  className="border-zinc-700 bg-zinc-800 text-white"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Last Name</label>
                <Input
                  type="text"
                  placeholder="Doe"
                  className="border-zinc-700 bg-zinc-800 text-white"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                className="border-zinc-700 bg-zinc-800 text-white"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Password</label>
              <Input
                type="password"
                placeholder="Create a password"
                className="border-zinc-700 bg-zinc-800 text-white"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Create Account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth/login')}
              className="text-purple-400 hover:text-purple-300"
            >
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;