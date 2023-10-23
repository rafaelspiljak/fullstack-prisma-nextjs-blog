"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

export default function Form({ type }: { type: "login" | "register" }) {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setLoading(true);
        if (type === "login") {
          signIn("credentials", {
            redirect: false,
            phoneNumber: e.currentTarget.phoneNumber.value,
            password: e.currentTarget.password.value,
            // @ts-ignore
          }).then(({ error }) => {
            if (error) {
              setLoading(false);
              toast.error(error);
            } else {
              toast.success("Login successfull!");
              router.push("/");
            }
          });
        } else {
          fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phoneNumber: e.currentTarget.phoneNumber.value,
              password: e.currentTarget.password.value,
              firstName: e.currentTarget.firstName.value,
              lastName: e.currentTarget.lastName.value,
            }),
          }).then(async (res) => {
            setLoading(false);
            if (res.status === 200) {
              toast.success("Account created! Redirecting to login...");
              setTimeout(() => {
                router.push("/login");
              }, 2000);
            } else {
              const { error } = await res.json();
              toast.error(error);
            }
          });
        }
      }}
      className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16"
    >
      {type === "register" && (
        <div>
          <div>
            <label
              htmlFor="firstName"
              className="block text-xs text-gray-600 uppercase"
            >
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="firstName"
              placeholder="Ime"
              autoComplete="firstName"
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-xs text-gray-600 uppercase"
            >
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="lastName"
              placeholder="Prezime"
              autoComplete="lastName"
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
            />
          </div>
        </div>
      )}
      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-xs text-gray-600 uppercase"
        >
          Phone Number
        </label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="phoneNumber"
          placeholder="0911111111"
          autoComplete="phoneNumber"
          required
          className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-xs text-gray-600 uppercase"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
        />
      </div>
      <button
        disabled={loading}
        className={`${
          loading
            ? "cursor-not-allowed border-gray-200 bg-gray-100"
            : "border-black bg-black text-white hover:bg-white hover:text-black"
        } flex h-10 w-full items-center justify-center rounded-md border text-sm transition-all focus:outline-none`}
      >
        {loading ? null : <p>{type === "login" ? "Sign In" : "Sign Up"}</p>}
      </button>
      {type === "login" ? (
        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account? <Link href="/register">Sign up</Link> for
          free.
        </p>
      ) : (
        <p className="text-center text-sm text-gray-600">
          Already have an account? <Link href="/login">Sign in</Link> instead.
        </p>
      )}
    </form>
  );
}
