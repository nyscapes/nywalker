Feature: Using Books
  Scenario: Seeing the list of books
    Given I am on the "Books" page
    Then I should see a list of books

  Scenario: Add instance button
    Given I am on the "Books" page
    And I am an admin
    Then I should see an "Add Instance" button
