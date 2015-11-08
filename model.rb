require 'data_mapper'
require 'dm-validations'
require 'dm-types'
require 'dm-postgis'
require 'active_support' # for the slugs
require 'active_support/inflector'
require 'active_support/core_ext/array/conversions'

# The local install requires running `createdb nywalker`
#
# Furthermore, we require adding postGIS. Open the db with `psql nywalker`
# and then run `CREATE EXTENSION postgis;` on the dev machine. PostGIS is
# available only on pro installs on heroku, which is why this can't be
# deployed there. Oops. 
#
# I mean, if you want to pay…

DataMapper.setup(:default, ENV['DATABASE_URL'] || "postgres://localhost:5432/nywalker")

class Instance
  include DataMapper::Resource

  property :id, Serial
  property :page, Integer
  property :added_on, Date
  property :modified_on, Date

  belongs_to :place
  belongs_to :user
  belongs_to :book

  validates_presence_of :page
  validates_presence_of :place
  validates_presence_of :book

end

class Place
  include DataMapper::Resource

  property :id, Serial
  property :name, String
  property :added_on, Date
  property :lat, Float
  property :lon, Float
  property :geom, PostGISGeometry

  belongs_to :user

  validates_presence_of :name
  validates_presence_of :lat
  validates_presence_of :lon
  validates_presence_of :geom
end

class Book
  include DataMapper::Resource

  property :id, Serial
  property :author, String # should maybe be array, but...
  property :title, String
  property :isbn, String
  property :year, Integer
  property :url, Text
  property :cover, Text
  property :added_on, Date
  property :modified_on, Date

  has n, :instances
  has n, :users, through: Resource

  validates_presence_of :author
  validates_presence_of :title

end

class User
  include DataMapper::Resource

  property :id, Serial
  property :name, String
  property :email, String
  property :username, String, key: true
  property :password, BCryptHash
  property :admin, Boolean, default: false
  property :added_on, Date
  property :modified_on, Date

  has n, :instances
  has n, :books, through: Resource
  has n, :places

  validates_uniqueness_of :username
  validates_presence_of :password
  validates_presence_of :email

end

DataMapper.finalize # sets up the models for first time use.
# DataMapper.auto_migrate! # CREATE/DROP while killing the data
DataMapper.auto_upgrade! # Tries to make the schema match the model.
