import React from "react" 
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "../app"
import { submitForm } from "../api"
import { rest } from "msw"
import { server } from "../../tests/server"


jest.mock("../api", () => ({
  submitForm: jest.fn(),
}))

beforeEach(() => {
  submitForm.mockReset()
})

test("Scénario 1: cas passant - formulaire rempli correctement", async () => {
  submitForm.mockResolvedValueOnce({ data: { success: true } })

  render(<App />)

  expect(screen.getByRole("heading", { name: /welcome home/i })).toBeInTheDocument()
  userEvent.click(screen.getByRole("link", { name: /fill out the form/i }))

  expect(screen.getByRole("heading", { name: /page 1/i })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: /go home/i })).toBeInTheDocument()

  userEvent.type(screen.getByLabelText(/favorite food/i), "Les pâtes")
  userEvent.click(screen.getByRole("link", { name: /next/i }))

  expect(screen.getByRole("heading", { name: /page 2/i })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: /go back/i })).toBeInTheDocument()

  userEvent.type(screen.getByLabelText(/favorite drink/i), "Bière")
  userEvent.click(screen.getByRole("link", { name: /review/i }))

  expect(screen.getByRole("heading", { name: /confirm/i })).toBeInTheDocument()
  expect(screen.getByText(/please confirm your choices/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/favorite food/i)).toHaveTextContent("Les pâtes")
  expect(screen.getByLabelText(/favorite drink/i)).toHaveTextContent("Bière")
  expect(screen.getByRole("link", { name: /go back/i })).toBeInTheDocument()

  userEvent.click(screen.getByRole("button", { name: /confirm/i }))

  await waitFor(() => {
    expect(screen.getByText(/congrats\. you did it\./i)).toBeInTheDocument()
  })

  userEvent.click(screen.getByRole("link", { name: /go home/i }))
  expect(screen.getByRole("heading", { name: /welcome home/i })).toBeInTheDocument()
})

test("Scénario 2: cas non passant - champ food vide", async () => {
  submitForm.mockRejectedValueOnce({ message: "les champs food et drink sont obligatoires" })

  render(<App />)

  expect(screen.getByRole("heading", { name: /welcome home/i })).toBeInTheDocument()
  userEvent.click(screen.getByRole("link", { name: /fill out the form/i }))

  expect(screen.getByRole("heading", { name: /page 1/i })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: /go home/i })).toBeInTheDocument()


  userEvent.click(screen.getByRole("link", { name: /next/i }))

  expect(screen.getByRole("heading", { name: /page 2/i })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: /go back/i })).toBeInTheDocument()

  userEvent.type(screen.getByLabelText(/favorite drink/i), "Bière")
  userEvent.click(screen.getByRole("link", { name: /review/i }))

  expect(screen.getByRole("heading", { name: /confirm/i })).toBeInTheDocument()
  expect(screen.getByText(/please confirm your choices/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/favorite food/i)).toHaveTextContent("")
  expect(screen.getByLabelText(/favorite drink/i)).toHaveTextContent("Bière")
  expect(screen.getByRole("link", { name: /go back/i })).toBeInTheDocument()

  userEvent.click(screen.getByRole("button", { name: /confirm/i }))

  await waitFor(() => {
    expect(screen.getByText(/oh no\. there was an error\./i)).toBeInTheDocument()
  })

  expect(screen.getByText(/les champs food et drink sont obligatoires/i)).toBeInTheDocument()
  expect(screen.getByRole("link", { name: /go home/i })).toBeInTheDocument()

  userEvent.click(screen.getByRole("link", { name: /try again/i }))
  expect(screen.getByRole("heading", { name: /page 1/i })).toBeInTheDocument()
})
