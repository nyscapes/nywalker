require 'sequel'
require 'dotenv'

Dotenv.load # This is weird that it's called here, because app.rb uses it.

# ENV['DATABASE_URL'] is set in the file .env, which is hidden from git. See .env.example for an example of what it should look like.

if ENV['DATABASE_URL']
  DB = Sequel.connect(ENV['DATABASE_URL'])
else
  raise "ENV['DATABASE_URL'] must be set. Edit your '.env' file to do so."
end

# The local install requires running `createdb nywalker`, assuming you name
# the database "nywalker".
#
# Furthermore, we require adding postGIS. Open the db with `psql nywalker`
# and then run `CREATE EXTENSION postgis;` on the dev machine. PostGIS is
# available only on pro installs on heroku, which is why this can't be
# deployed there. Oops. 
#
# I mean, if you want to pay…

class Instance < Sequel::Model
  plugin :validation_helpers

  many_to_one :place
  many_to_one :user
  many_to_one :book

  def validate
    super
    validates_presence [:page, :book, :text]
  end

end

class Place < Sequel::Model
  plugin :validation_helpers

  many_to_one :user
  one_to_many :nicknames
  one_to_many :instances

  def validate
    super
    validates_presence [:name, :slug]
    validates_unique :slug
  end

  # def demolish!
  #   self.nicknames.each{ |n| n.destroy! }
  #   self.destroy!
  # end

  # def merge(oldslug)
  #   oldplace = Place.first slug: oldslug
  #   if oldplace.nil?
  #     puts "Could not find '#{oldslug}'"
  #   else
  #     Instance.all(place: oldplace).each do |instance|
  #       instance.update(place: self)
  #     end
  #     oldplace.demolish!
  #   end
  # end
  
  dataset_module do
    
    def real_places_with_instances(book)
      if book == "all"
        where(id: Instance.select(:place_id))
        where(confidence: /[123]/)
        .all
      else
        where(id: Instance.where(book: book).select(:place_id))
        where(confidence: /[123]/)
        .all
      end
    end

  end
end

class Flag < Sequel::Model
  plugin :validation_helpers

  many_to_one :user

  def validate
    super
    validates_presence [:object_type, :object_id]
  end

end

class Nickname < Sequel::Model
  plugin :validation_helpers

  many_to_one :place

  def validate
    super
    validates_presence [:name]
  end

  # def instance_count_query
  #   Instance.all(place: self.place, text: self.name).count
  # end

  def list_string
    "#{self.name} -- {#{self.place.name}}"
  end
end

class Special < Sequel::Model
  plugin :validation_helpers

  one_to_one :book

  def validate
    super
    validates_presence [:field]
  end

end

class Book < Sequel::Model
  plugin :validation_helpers

  one_to_one :special
  one_to_many :instances
  many_to_many :users, left_key: :user_id, right_key: :book_id, join_table: :book_users

  def validate
    super
    validates_presence [:author, :title, :slug]
    validates_unique :slug
  end

  def total_pages
    instances = Instance.where(book: self).map(:page).sort
    instances.length == 0 ? 0 : instances.last - instances.first
  end

end

class User < Sequel::Model
  plugin :validation_helpers

  one_to_many :instances
  many_to_many :books, left_key: :user_id, right_key: :book_id, join_table: :book_users
  one_to_many :places
  one_to_many :flags

  def validate
    super
    validates_presence [:username, :password, :email]
    validates_unique [:email]
  end

  # def authenticate(attempted_password)
  #   self.password == attempted_password ? true : false
  # end

end
