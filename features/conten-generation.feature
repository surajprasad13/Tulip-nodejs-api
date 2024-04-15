# Feature: Content generation

#   Background: 
#     Given an actual tulip api

#   Scenario: after survey, user is presented with information
#     Given the plan "long_covid" is selected - cached
#     Given the user answered the survey as in 'answers-free-long-covid-1.json' file
#     Then we generate an introductory text for the user