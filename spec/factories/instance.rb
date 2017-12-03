FactoryBot.define do
  sequence :order_in_page do |n|
    n
  end

  factory :instance do
    # page { Faker::Number.digit }
    page 1
    add_attribute(:sequence) { generate :order_in_page }
    text { Faker::Address.city }
    flagged false
    note { Faker::Lorem.sentence }
    place
    user
    book
  end

end
