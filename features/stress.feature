# Feature: Works under load of 500k users

#   Background:
#     Given an actual tulip api

#   Scenario: massive database login
#     Given the user tries to login with standard credentials
#     When for 1000 times the auth/userRegister endpoint is called
#     Then all responses http status code are 200

# #   Scenario: Users registers with a very long email
# #     Given the user email is 350 characters long
# #     Given the user chose "hunTer!2345" as his password
# #     When the auth/userRegister endpoint is called
# #     Then the response http status code is 400