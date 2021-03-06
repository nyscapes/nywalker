# frozen_string_literal: true
class Instance < Sequel::Model
  plugin :validation_helpers

  many_to_one :place
  many_to_one :user
  many_to_one :book

  def after_create
    super
    # Add a time
    self.added_on = Time.now
  end

  def after_save
    super
    # See if the nickname is new or not
    nickname = Nickname.where(name: self.text, place: self.place).first
    if nickname.nil?
      nickname = Nickname.create(name: self.text, place: self.place, instance_count: 1)
    end
    nickname.update instance_count: self.class.nickname_instance_count(self.text, self.place)
    # # increase the sequences of the other instances
    sequence_counter = self.sequence
    self.class.later_instances_of_same_page(self.book, self.page, self.sequence).select{ |i| i.id != self.id }.each_with_index do |later_instance, index|
      later_instance.update(sequence: sequence_counter + 1 + index)
    end
    self.modified_on = Time.now
  end

  def validate
    super
    validates_presence [:page, :text]
  end

  # API methods
  def lat
    self.place.lat
  end

  def lon
    self.place.lon
  end

  def place_name
    self.place.name
  end

  def mappable
    self.place.confidence =~ /[123]/ ? true : false
  end

  dataset_module do

    def all_placeids_with_counts(book = nil)
      if book.nil?
        group_and_count(:place_id)
        .all
      else
        where(book: book)
          .group_and_count(:place_id)
          .all
      end
    end

    def all_sorted_for_book(book)
      raise ArgumentError.new( "'book' must be a Book" ) if book.class != Book
      where(book: book)
        .order(:page, :sequence)
        .all
    end

    def last_instance_for_book(book)
      raise ArgumentError.new( "'book' must be a Book" ) if book.class != Book
      where(book: book)
        .order(Sequel.desc(:modified_on), :page, :sequence)
        .last
    end

    def later_instances_of_same_page(book, page, seq)
      raise ArgumentError.new( "'book' must be a Book" ) if book.class != Book
      raise ArgumentError.new( "'page' and 'sequence' must be Integer" ) if page.class != Integer || seq.class != Integer
      where(book: book, page: page)
        .where{ sequence >= seq }
        .all
    end
  
    def nickname_instance_count(text, place)
      raise ArgumentError.new( "'place' must be a Place" ) if place.class != Place
      where(text: text, place: place)
        .all
        .length
    end

    def all_users_sorted_by_count(book = nil)
      if book.nil?
        group_and_count(:user_id).order(:count).reverse.all
      else
        where(book: book).group_and_count(:user_id).order(:count).reverse.all
      end
    end

  end

  def before_destroy
    n = Nickname.where(name: self.text, place: self.place).first
    n.update instance_count: n.instance_count - 1
    Instance.where(book: self.book, page: self.page).where{ sequence > self.sequence }.each do |instance|
      instance.update(sequence: instance.sequence - 1)
    end
  end
end
