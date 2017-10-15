class App
  module RakeMethods

    # def redis
    #   @redis ||= Redis.new
    # end

    def self.cache_list_of_books(redis = Redis.new)
      books = Book.all(order: [:title.asc])
      list = books.map do |b|
        {
          author: b.author,
          title: b.title,
          id: b.id,
          slug: b.slug,
          url: b.url,
          year: b.year,
          user_sentence:  b.users.map{ |u| u.name }.to_sentence,
          instances: b.instances.length,
          total_pages: b.total_pages
        }
      end
      redis.hmset "book-list", "last-updated", Time.now, "list", list.to_json
    end

    def self.cache_instances_of_all_books(redis = Redis.new)
      Book.each do |book|
        App::RakeMethods.cache_list_of_instances(book, redis)
      end
    end

    def self.cache_list_of_instances(book, redis = Redis.new)
      instances = Instance.all(book: book, order: [:page.asc, :sequence.asc])
      unless redis.hmget("book-#{book.slug}-instances", "count")[0].to_i == instances.count
        list = instances.map do |i|
          {
            page: i.page,
            sequence: i.sequence,
            place_name: i.place.name,
            place_slug: i.place.slug,
            id: i.id,
            owner: i.user.name,
            flagged: i.flagged,
            note: i.note,
            text: i.text,
            special: i.special
          }
        end
        redis.hmset "book-#{book.slug}-instances", "last-updated", Time.now, "list", list.to_json, "count", list.length
      end
    end
 
    def self.build_places(instances) 
      instances.all.places.all(:confidence.not => 0).map do |p|
        { lat: p.lat, lon: p.lon, 
          name: p.name, 
          count: p.instances_per.count,
          place_names: p.instances_by_names,
          place_names_sentence: p.names_to_sentence,
          slug: p.slug,
          confidence: p.confidence
        } 
      end
    end

  #
  #
  #
  end
end
