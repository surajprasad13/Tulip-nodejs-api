# Feature: User registration, login and password change

#   Background:
#     Given a tulip api

#   Scenario: Users registers on the platform
#     Given the user email is "<email>"
#     Given the user chose "<password>" as his password
#     When the auth/userRegister endpoint is called
#     Then the response http status code is <statusCode>

#   Examples:
#     | email                 | password     | statusCode |
#     | example@meettulip.com | hunTer!2345  | 200        |
#     | example@meettulip.com | hunter!2345  | 400        |
#     | example@meettulip.com | hunTer12345  | 400        |
#     | example@meettulip.com | hunTer!!!!!  | 400        |
#     | example@meettulip@com | hunTer!2345  | 400        |
#     | example               | hunTer!2345  | 400        |
#     |                       | hunTer!2345  | 400        |
#     | example@meettulip@com |              | 400        |
#     |                       |              | 400        |


# # TODO swagger mentions 404, but userRegistration and sendMailOtp always return 400 for all errors

#   Scenario: Users registers with a very long email
#     Given the user email is 350 characters long
#     Given the user chose "hunTer!2345" as his password
#     When the auth/userRegister endpoint is called
#     Then the response http status code is 400

#     Scenario: User sendMailOtp
#       Given the user email is "<email>"
#       When the auth/sendMailOtp endpoint is called
#       Then the response http status code is <statusCode>
#     Examples:
#       | email                 | statusCode |
#       | example@meettulip.com | 200        |
#       | bazinga@example.com   | 400        |
#       | bazinga@example@com   | 400        |
#       |                       | 400        |

#   Scenario: Users resets his password
#     Given the user email is "<email>"
#     Given the user chose "<password>" as his new password
#     When the auth/resetPassword endpoint is called
#     Then the response http status code is <statusCode>

#     Examples:
#       | email                 | password     | statusCode |
#       | example@meettulip.com | Hunter!2345  | 200        |
#       | example@meettulip.com | hunter!2345  | 400        |
#       | example@meettulip.com | hunTer12345  | 400        |
#       | example@meettulip.com | hunTer!!!!!  | 400        |
#       | example@meettulip@com | hunTer!2345  | 400        |
#       | example               | hunTer!2345  | 400        |
#       |                       | hunTer!2345  | 400        |
#       | example@meettulip@com |              | 400        |
#       |                       |              | 400        |