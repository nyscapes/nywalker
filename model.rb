require 'sequel'
require 'sequel/extensions/pagination'
require 'will_paginate'
require 'will_paginate/collection'
require 'will_paginate/sequel'
require 'will_paginate/array' # might not be the best place…
require 'dotenv'

Dotenv.load # This is weird that it's called here, because app.rb uses it.

# ENV['DATABASE_URL'] is set in the file .env, which is hidden from git. See .env.example for an example of what it should look like.

if ENV['RACK_ENV'] == 'test'
  puts "Using test database"
  DB = Sequel.connect(ENV['TEST_DATABASE_URL'])
  Sequel.extension :migration
  Sequel::Migrator.check_current(DB, 'db/migrations')
else
  if ENV['DATABASE_URL']
    DB = Sequel.connect(ENV['DATABASE_URL'])
    Sequel.extension :migration
    Sequel::Migrator.check_current(DB, 'db/migrations')
    puts "Connected to #{ENV['DATABASE_URL']}"
  else
    raise "ENV['DATABASE_URL'] must be set. Edit your '.env' file to do so."
  end
end

DB.extension(:pagination) # load paginator

# The local install requires running `createdb nywalker`, assuming you name
# the database "nywalker".

require_relative 'models/instance'
require_relative 'models/place'
require_relative 'models/book'
require_relative 'models/flag'
require_relative 'models/nickname'
require_relative 'models/special'
require_relative 'models/user'


